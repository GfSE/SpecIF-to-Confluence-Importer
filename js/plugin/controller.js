/**
 * Created by Marcus Bätz on 29.03.2017.
 */
define([
        "jquery",
        "data",
        "specIF-loader",
        "lodash"
    ], function ($,
                 data,
                 specIFLoader,
                 _) {
        /**
         *Handlerobject for SpecIF Data.
         */
        let specif;
        /**
         * Represents the actual amount of the upload progress in number of pages
         */
        let progress;
        /**
         * The maximum number of pages to upload
         */
        let maxProgress;
        /**
         * Shows if the Space key is user generated(true) or generic(false)
         */
        let isOwnKey;
        /**
         * The space created for the upload
         */
        let space;
        /**
         * This variable is set to true if the upload process is canceled by the user or an error.
         * This variable will be checked every time a asynchronous call should start. If true each function returns.
         */
        let isCanceled;
        /**
         * This array is used for page numeration. It represents a page its number and the id of its parent page,
         * that can be used to get parent pages number
         */
        let indexNumbers;
        /**
         * This object holds all string constants for localization
         */
        let i18n;
        /**
         *this function is used for error handling
         */
        let error = (buildError)();

        /**
         * It loads all necessary html and the json file for the language used in Browser
         */
        function init() {

            $('#menu').load("/menu.html", function () {
                let lang = navigator.language || navigator.userLanguage;
                if (!lang || lang === "en") lang = "default";
                $('#dialog').load("/dialog.html", function () {
                    $.getJSON("localization/" + lang + ".json").done(initializeSite).fail(
                        function () {
                            $.getJSON("localization/default.json").done(initializeSite);
                        }
                    );
                });

            });

        }

        /**
         * The function localizes the html page and add event handler to the
         * form fields. It loads also all existing spaces from confluence
         * @param dataObject the localization file
         */
        function initializeSite(dataObject) {
            i18n = dataObject;

            let temp = _.template($('#menu-template').html());
            $('#Side-bar').append(temp(i18n));
            temp = _.template($('#dialog-template').html());
            $('#dialog').text("");
            $('#dialog').append(temp(i18n));
            dialogAddEventHandler();

            $('#main').css("display", "flex");
            let $dropDown = $("#dropdown-spaces");
            isOwnKey = false;

            addSpacesToDropDownMenu($dropDown);
            $("#loadData").click(upload);

            $('#space-title').on("input", validateTitle);
            $('#space-key')
                .on("input", validateKey)
                .keyup(function () {
                    isOwnKey = !!$(this).val();
                })
                .focusout(function () {
                    if (!isOwnKey) generateKey();
                    validateKey.call($('#space-key'));
                });

            $dropDown.change(selectSpace);
            $('#clear-ffi').click(clearSelectedSpecIFZFile);
            $('#file-chooser').change(addSelectedSpecIFZFile);
        }

        /**
         * Adds event handler to the cancel and submit button of the upload dialog
         */
        function dialogAddEventHandler() {
            $("#dialog-cancel-load").click(cancel);
            $('#dialog-submit-button').click(function () {
                AJS.dialog2("#upload-dialog").hide();
            });
        }

        /**
         * This function is called if an error occurs or the cancel button is clicked on the upload dialog
         */
        function cancel() {
            isCanceled = true;
            AJS.dialog2("#upload-dialog").hide();
        }

        /**
         * Closure returns a function that handles all given error objects and shows the error in the upload dialog
         * or if creates an error dialog if no upload is available
         * @returns {Function}
         */
        function buildError() {
            return function (message) {
                if (message.message) message = message.message;
                if (AJS.$("#upload-dialog").attr("aria-hidden") !== "false") createDialog();
                setUploadMessage(message, "error");

                AJS.$("#upload-dialog").addClass("aui-dialog2-warning");
                isCanceled = true;
                AJS.$('#progress-bar').hide();
                AJS.$('.button-spinner').hide();
                AJS.$('#error').show();
                AJS.$('#complete').hide();
                AJS.$('#dialog-submit-button').show();
                AJS.$('#dialog-cancel-load').hide();
                AJS.$('#cancel-hint').hide();
            };
        }

        /**
         * resets all necessary variables and validates data path, key and space title.
         * Afterwards it creates the upload dialog and starts the upload depending on which kind of upload typ is chosen
         */
        function upload() {

            isCanceled = false;
            indexNumbers = [];
            space = undefined;
            progress = 0;
            let path = $('#file-chooser').val();
            if (validatePath(path) & validateKey.call($('#space-key')) & validateTitle.call($('#space-title'))) {
                space = {
                    name: $('#space-title').val(),
                    key: $('#space-key').val()
                };
                setUploadMessage(i18n.PREPARING_FOR_UPLOAD, "generic");
                createDialog();
                if (AJS.$('#radioButtonUpdate').prop("checked")) {

                } else if (AJS.$('#radioButtonClone').prop("checked")) {
                    specif = specIFLoader(URL.createObjectURL($('#file-chooser').prop('files')[0]), i18n, cloneToOldSpace, error);
                } else {
                    specif = specIFLoader(URL.createObjectURL($('#file-chooser').prop('files')[0]), i18n, deleteOldSpace, error);
                }

            }
        }

        /**
         * Creates the Upload dialog and sets all items to a proper state
         */
        function createDialog() {
            AJS.dialog2("#upload-dialog").show();
            AJS.$('.button-spinner').show();
            AJS.$('#progress-bar').hide();
            AJS.$('.button-spinner').spin();
            AJS.$('#dialog-submit-button').hide();
            AJS.$('#dialog-cancel-load').show();
            AJS.$('#link-button').hide();
            AJS.$('#error').hide();
            AJS.$('#complete').hide();
            AJS.$('#cancel-hint').show();
            AJS.$("#upload-dialog").removeClass("aui-dialog2-warning");
        }

        /**
         * Request user spaces from Confluence and adds them to the drop down list
         * @param $dropDown
         */
        function addSpacesToDropDownMenu($dropDown) {
            data.getSpaces(function (success) {
                $dropDown.text("");
                JSON.parse(success).results.forEach(function (entry) {
                    $dropDown.append($('<option/>').attr('value', entry.key).text(entry.name));
                });
                $dropDown.prop("selectedIndex", -1);
            }, error);
        }

        /**
         * Creates a message in the upload dialog
         * @param message The message to be shown
         * @param type the message type: generic, success, error, (warning)
         */
        function setUploadMessage(message, type) {
            $('#aui-message-bar').text("");

            if (typeof message === 'string')
                AJS.messages[type]({
                    title: message,
                    closeable: false
                });
            else if (type === "error") {
                AJS.messages[type]({
                    title: message.statusText || i18n.UNKNOWN_ERROR,
                    body: message.responseText || "",
                    closeable: false
                });
            }

        }

        /**
         * Will be called if the upload was successful
         * This function calls the reset for the form menu
         */
        function success() {
            AJS.$('#dialog-submit-button').show();
            AJS.$('#dialog-cancel-load').hide();
            setUploadMessage(i18n.UPLOAD_SUCCESS, "success");
            reset();
            AJS.$('#link-button').show();
            if (!isIE()) {
                AJS.$('#space-link').attr("href", space._links.base + space._links.webui);
                AJS.$('#space-link').text(i18n.Open + space.name);
            }
            AJS.$('#complete').show();
            AJS.$('#progress-bar').hide();

        }

        /**
         * Checks if the ie 11 or lower is used
         * @returns {boolean} true if ie es 11 or lower else false
         */
        function isIE() {
            let ua = window.navigator.userAgent;
            let msie = ua.indexOf("MSIE ");
            return msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
        }

        /**
         *Rests the form. Called after successful upload
         */
        function reset() {
            isOwnKey = false;
            addSpacesToDropDownMenu($("#dropdown-spaces"));
            $('#space-key').val("");
            $('#space-title').val("");
            clearSelectedSpecIFZFile.call($('#clear-ffi'));
            progress = 0;
        }

        /**
         * Removes the selected file from the form.
         */
        function clearSelectedSpecIFZFile() {

            $(this).css("display", "none");
            $('#file-chooser').val("");
            $(this).parent().attr("data-ffi-value", "");
        }

        /**
         * Adds chosen specIF file to the form
         */
        function addSelectedSpecIFZFile() {
            let path = $(this).val().replace(/\\/g, "/");
            if (path) $('#clear-ffi').css("display", "block");
            else  $('#clear-ffi').css("display", "none");
            if (!path) return;
            validatePath(path);
            $(this).parent().attr("data-ffi-value", path.substr(path.lastIndexOf("/") + 1));
        }

        /**
         * Adds a selected space and Key from dropdown menu to title and key field
         */
        function selectSpace() {
            isOwnKey = true;
            let $option = $($(this)[0][$(this)[0].selectedIndex]);
            $('#space-title').val($option.text());
            $('#space-key').val($option.attr("value"));
        }

        /**
         * Validates the chosen specIF path as far as possible.
         * @param path The given path
         * @returns true if path is valid else false and shows error message
         */
        function validatePath(path) {
            if (path === "") {
                return validationError($('#file-chooser').parent().parent().children(".error"), i18n.EMPTY_PATH);
            } else if (!path.includes(".specifz")) {
                return validationError($('#file-chooser').parent().parent().children(".error"), i18n.NO_SPECIFZ_FILE);
            } else {
                return hideError($('#file-chooser').parent().parent().children(".error"))
            }
        }

        /**
         * Validates the space title.
         * @returns  true if title is valid else false and shows error message
         */
        function validateTitle() {
            if ($(this).val()) {
                if (!isOwnKey) generateKey();
                return hideError($(this).parent().children(".error"));
            }
            else {
                $('#space-key').val("");
                return validationError($(this).parent().children(".error"), i18n.EMPTY_TITLE_MESSAGE);


            }
        }

        /**
         * Validates the space key.
         * @returns  true if key is valid else false and shows error message
         */
        function validateKey() {
            if ($(this).val()) {
                if ($(this).val().match(/^[A-Za-z0-9]*$/)) return hideError($(this).parent().children(".error"));
                else return validationError($(this).parent().children(".error"), i18n.KEY_VALIDATION_MESSAGE);
            }
            else  return validationError($(this).parent().children(".error"), i18n.EMPTY_KEY_MESSAGE);
        }

        /**
         * Hides a given error message for the form validation
         * @param $error
         * @returns {boolean}
         */
        function hideError($error) {
            if ($error) {
                $error.addClass("hidden");
                $error.text("");
            }
            return true;
        }

        /**
         * Shows a given error message as error for the form validation
         * @param $error
         * @param message
         * @returns {boolean}
         */
        function validationError($error, message) {
            if ($error) {
                $error.removeClass("hidden");
                $error.text(message);
            }
            return false;
        }

        /**
         * Generates a generic key for a given space title.
         */
        function generateKey() {
            if (!isOwnKey) {
                let $field = $('#space-title');
                let key = "";
                if ($field.val().includes(" ")) {
                    let parts = $field.val().split(" ");
                    parts.forEach(function (entry) {
                        if (entry.length > 0 && entry[0].match(/[A-Za-z0-9äöüÄÖÜ]/)) key += entry[0].toUpperCase();
                    });
                } else {
                    for (let i = 0; i < $field.val().length; i++)
                        if ($field.val()[i].match(/[A-Za-z0-9äöüÄÖÜ]/)) key += $field.val()[i].toUpperCase();

                }
                $('#space-key').val(key.replace("Ä", "A").replace("Ö", "O").replace("Ü", "U"));
            }
        }

        /**
         * Sets the value for maxProgress.
         */
        function setProgress() {
            maxProgress = specif.getHierarchieNodesSize(specif.getRoot()) - 1;

        }

        /**
         * Clones specIF data to an existing space
         */
        function cloneToOldSpace() {
            //TODO not finished. Criteria not defined
            setProgress();
            let root = specif.getRoot();


            data.getSpace(space.key, function (response) {
                if (isCanceled)return;
                space = JSON.parse(response);
                // let page = createPageFromObject(undefined, space.homepage.id);
                // page.title = specif.getTitle();
                // data.createPage(page, function (success) {
                uploadAllImageFiles();
                createHierarchies(space.homepage.id, root, 0);
                AJS.progressBars.setIndeterminate("#progress-bar");
                AJS.$('.button-spinner').hide();
                AJS.$('#progress-bar').show();
                setUploadMessage(i18n.UPLOADING, "generic");
                // }, function (err) {
                //     if (isCanceled)return;
                //     error(err);
                // });
            }, function (err) {
                if (isCanceled)return;
                if (err.status === 404) error(i18n.NO_SPACE_AVAILABLE);
                else error(err);

            });
        }

        /**
         * Delete old space if available
         */
        function deleteOldSpace() {
            setProgress();
            let root = specif.getRoot();


            data.removeSpace(space.key, function (success) {
                waitForCompleteDeletion(JSON.parse(success).links.status,
                    function () {
                        if (isCanceled)return;
                        createNewSpace(root);
                    });


            }, function (err) {
                if (isCanceled)return;
                if (err.status === 404) createNewSpace(root);
                else error(err);

            });
        }

        /**
         * This function checks if deletion of old space is complete: If not it will wait a second an checks again,
         * else call the callback function.
         * @param url confluence deletion long task url
         * @param callback Will be called if deletion is complete
         */
        function waitForCompleteDeletion(url, callback) {
            data.waitForCompleteDeletion(url, function (response) {
                if (isCanceled)return;
                if (JSON.parse(response).successful) callback();
                else setTimeout(waitForCompleteDeletion(url, callback), 1000);
            });
        }

        /**
         * Creates a new space for the given title and key
         * @param root is the specif hierarchical root node
         */
        function createNewSpace(root) {
            if (isCanceled)return;
            space.type = "global";
            space.description = {"plain": {"value": "", "representation": "plain"}};
            data.addSpace(space, function (response) {
                if (isCanceled)return;
                space = JSON.parse(response);
                uploadAllImageFiles();
                clearHomepage();
                createHierarchies(space.homepage.id, root, 0);
                AJS.progressBars.setIndeterminate("#progress-bar");
                AJS.$('.button-spinner').hide();
                AJS.$('#progress-bar').show();
                setUploadMessage(i18n.UPLOADING, "generic");
            }, error);

        }

        /**
         * Load asynchronous all image files as an attachment to the space homepage
         * There is no need for waiting on its finalization, because the files will be linked relative in there pages.
         * If the files ar not fully uploaded but the page is, then there will be shown a placeholder.
         */
        function uploadAllImageFiles() {

            let specifZ = specif.getFiles();
            for (let i = 0; i < specifZ.length; i++) {
                if (specifZ[i].name.endsWith(".specif"))continue;
                if (isCanceled)return;
                specifZ[i].async("arraybuffer").then(function (value) {
                    let start = specifZ[i].name.lastIndexOf("/");
                    if (start === -1) start = 0;
                    let name = specifZ[i].name.substr(start);
                    if (name) {
                        let formData = {
                            file: new File([value], name, {type: getImageTypeForName(name)})
                        };
                        data.addAttachment(space.homepage.id, formData, function (response) {
                        }, error);
                    }
                });
            }

        }

        /**
         * Returns the needed request image type for the given image filename
         * @param name of the image file
         * @returns string with pattern 'Image' + '/' + Type
         */
        function getImageTypeForName(name) {
            //TODO unfinished not all image types are available
            if (name.endsWith(".png"))return "Image/png";
            else if (name.endsWith(".svg"))return "Image/svg+xml";
            else if (name.endsWith(".gif"))return "Image/gif";
            else if (name.endsWith(".jpg"))return "Image/jpg";
        }

        /**
         * Clears the standard homepage, confluence creates automatic for a new Space
         */
        function clearHomepage() {
            //TODO Change the homepage from empty context to user defined
            data.getPage(space.homepage.id, function (response) {
                let oldPage = JSON.parse(response);

                let updatePage = {
                    version: {
                        number: oldPage.version.number + 1
                    },
                    type: "page",
                    title: oldPage.title,
                    body: {
                        storage: {
                            value: "",
                            representation: "storage"
                        }
                    }
                };

                data.updatePage(space.homepage.id, updatePage);
            });
        }

        /**
         * This function returns an confluence image xhtml link from the reciving xml object.
         * If the Object is empty or does not contains an image address the return value will be empty.
         * @param obj an XML Object containing a specific image address
         * @returns string confluence image xhtml link or empty string if no object or image available
         */
        function makeImageHtmlStringFromXMLObject(obj) {
            if ($(obj)[0] && $(obj)[0].data) {
                let data = $(obj)[0].data;
                data = data.replace(/\\/g, "/");
                let name = data.substr(data.lastIndexOf('/') + 1);
                let path = '<ac:image>' +
                    '<ri:attachment ri:filename="' + name + '" >' +
                    '<ri:page ri:content-title="' + space.homepage.title + '"/>' +
                    '</ri:attachment>' +
                    '</ac:image>';
                return path;
            }
            return "";
        }

        /**
         * Creates a confluence page object for rest api request create page
         * @param object the specIF Object, the page has to be created for
         * @param parentID The confluence ContentID of the parent page
         * @returns {*} confluence page object
         */
        function createPageFromObject(object, parentID) {
            let page = {
                type: "page",
                ancestors: [{id: parentID}],
                space: {"key": space.key},
                body: {storage: {value: "", representation: "storage"}}
            };
            if (object) {
                for (let n = 0; n < object.attributes.length; n++) {
                    if (object.attributes[n].title.match("dcterms:description") ||
                        object.attributes[n].title.match("ReqIF.Text") ||
                        object.attributes[n].title.match("dc:description")) {
                        let html = $(object.attributes[n].value);
                        html.find("br").replaceWith("\n");
                        html.find("object").replaceWith(makeImageHtmlStringFromXMLObject(html.find("object")));
                        html.find('a').each(function (index, entry) {
                            if (!(/^https?:\/\//i.test($(entry).attr('href')))) {
                                $(entry).attr('href', "");
                            }
                        });
                        page.body.storage.value = html.html().replace("\t", "");
                    }
                }
                page.body.storage.value += specif.getAttributesAsHtmlStringForObject(object);
                page.body.storage.value += specif.getRelationsAsHtmlStringForObject(object);
                page.title = specif.makePageTitle(object);
            }
            return page;
        }

        /**
         * This function returns the page number, if the specIF object have to be numbered
         *
         * @param parentID The confluence ContentID of the parent page
         * @param index the hierarchical position of the page in the confluence space
         * @param object the specIF Object, the page has to be created for
         * @returns string if the object have to become a number the string contains the number else the string is empty
         */
        function pageNumber(parentID, index, object) {
            //TODO Change checking for chapter to checking for isHeading
            if (specif.isChapter(object)) {
                let num = "";
                indexNumbers[object.id] = {index: index + 1, parent: parentID};
                while (indexNumbers[parentID]) {
                    num = indexNumbers[parentID].index + "." + num;
                    parentID = indexNumbers[parentID].parent;
                }
                return num + (index + 1) + " ";
            }
            else return "";
        }

        /**
         * This function will create a confluence page. It also checks the hierarchical position of the Object in the
         * SpecIF hierarchy and uses it for the confluence hierarchy
         * @param rootID The ID of the SpecIF parent node
         * @param node The Specif node, that related to the object, the page has to be created for
         * @param index The index of the node inside its group
         */
        function createHierarchies(rootID, node, index) {
            if (isCanceled)return;
            if (index >= node.nodes.length) return;
            let object = specif.getSpecIFObjectForID(node.nodes[index].object);
            if (object) {
                let page = createPageFromObject(object, rootID);
                page.title = pageNumber(node.object, index, object) + " " + page.title;
                data.createPage(page, function (response) {
                    let createdPage = JSON.parse(response);
                    let log = "<p>/";
                    let notFirst = false;
                    createdPage.ancestors.forEach(function (entry) {
                        if (notFirst)
                            log += entry.title + "/";
                        else
                            notFirst = true;
                    });
                    log += page.title;
                    reorderCreatedPage(rootID, node, index, createdPage, specif.isChapter(object));
                }, function (err) {
                    console.log(page);
                    console.log(err);
                    error(err);
                });
            } else {
                createHierarchies(rootID, node, index + 1);
            }
        }


        /**
         *This function updates each unnumbered page to change its order to the order of the specIF file.
         * This is necessary because confluence orders his pages not in order of creation, but in alphabetical order.
         * Confluence also does not allow to change order right on creation.
         * @param rootID The ID of the SpecIF parent node
         * @param node The Specif node, that related to the object, the page has to be created for
         * @param index The index of the node inside its group
         * @param createdPage The returned page object from the create content rest api call
         * @param needOrder boolean, if true page needs reorder, if false page is ordered because it is numbered
         */
        function reorderCreatedPage(rootID, node, index, createdPage, needOrder) {
            /*TODO to avoid a partly occurring error it is necessary to synchronize the update process(much slower)
             or deactivate it(alphabetic order). Both decisions should make the user */
            if (needOrder) {
                let page = {
                    version: {
                        "number": createdPage.version.number + 1
                    },
                    title: createdPage.title,
                    type: "page",
                    extensions: {position: index}
                };
                data.updatePage(createdPage.id, page, function () {
                    progress++;
                    if (progress === maxProgress) success();
                    AJS.progressBars.update("#progress-bar", progress / maxProgress);
                    recursiveStepForHierarchicalOrder(rootID, node, index, createdPage);
                }, function (err) {
                    error(err)
                });
            } else {
                progress++;
                if (progress === maxProgress) success();
                AJS.progressBars.update("#progress-bar", progress / maxProgress);
                recursiveStepForHierarchicalOrder(rootID, node, index, createdPage);
            }

        }

        /**
         * This function calls both the createHierarchies for its follower in the same hirarchical level and for his first
         * child node if available.
         * @param rootID The ID of the SpecIF parent node
         * @param node The Specif node, that related to the object, the page has to be created for
         * @param index The index of the node inside its group
         * @param createdPage The returned page object from the create content rest api call
         * @param createdPage
         */

        function recursiveStepForHierarchicalOrder(rootID, node, index, createdPage) {
            if (node.nodes[index].nodes.length > 0) {
                createHierarchies(createdPage.id, node.nodes[index], 0);
            }
            createHierarchies(rootID, node, index + 1);
        }

        return {
            init: init
        };
    }
)
;
