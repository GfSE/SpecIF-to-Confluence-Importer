/**
 * Created by Marcus Bätz on 12.04.2017.
 */
define([
    "jquery",
    "jsZip",
    "jsZipUtils",
    "specifCheck"
], function ($,
             jsZip,
             jsZipUtils,
             specifCheck) {


    return function (path, i18n, callback, error) {
        /**
         * This Array holds all files extracted from the specIFZ zip File
         * @type {Array}
         */
        let specifZ = [];
        /**
         * Represents the specif json file from the specIFZ zip File
         */
        let specif;
        /**
         * Each key in this object is a page name, each value represents as int how often this page exists
         * @type {{}}
         */
        let duplicatedPageTitles = {};

        /**
         * holds a set of common specIF title attributes
         * @type {Array}
         */
        let titleAttributes = ["dcterms:title", "ReqIF.Name", "SpecIF:Heading", "ReqIF.ChapterName"];
        /**
         * holds a set of common specIF description attributes
         * @type {[*]}
         */
        let descriptionAttributes = ["dcterms:description", "ReqIF.Text", "dc:description"];

        /**
         * Loads automatically the binary content from given path
         */
        (function () {
            jsZipUtils.getBinaryContent(path, unzipSpecifZFile);
        })();

        /**
         * Begins a chain of function calls, starting with unzipping the SpecIFZ file.
         * @param err error object if
         * @param file the specIFZ file as binary array
         * @returns {Promise.<TResult>}
         */
        function unzipSpecifZFile(err, file) {

            let JSZip = new jsZip();

            if (err) error(err);
            else return JSZip.loadAsync(file).catch(error)
                .then(addEachFileToSpecifZ).catch(error)
                .then(parseSpecIFToJSON).catch(error)
                .then(checkScheme).catch(error)
                .then(checkConstraints).catch(error)
                .then(callback);
        }

        /**
         * Checks the SpecIF json, that all constraints a right
         * @returns bool
         */
        function checkConstraints() {
             return specifCheck.checkConstraints(specif);
        }

        /**
         * Checks the SpecIF json, that the scheme is right
         * @returns {*}
         */
        function checkScheme() {
            return specifCheck.checkSchema(specif);
        }

        /**
         * Adds each File from the SpeciFZ zip file to specIFZ
         * @param zip
         * @returns {*}
         */
        function addEachFileToSpecifZ(zip) {
            zip.forEach(function (relativePath, file) {
                if (file.dir === false) specifZ.push(file);
            });
            return zip;
        }

        /**
         * Takes the specif file from specIFZ and parses it to json.
         * Then place it to the specif object.
         * @param zip
         */
        function parseSpecIFToJSON(zip) {

            let specJson;
            for (let i = 0; i < specifZ.length; i++) {

                if (specifZ[i].name.endsWith(".specif")) {
                    specJson = specifZ[i];

                    break;
                }
            }
            return zip.file(specJson.name).async("string").then(function (value) {
                specif = JSON.parse(value);
            });
        }

        /**
         * If the object type of an object has an icon this function returns the icon
         * @param type object type
         * @returns {string} The object icon or an empty string
         */
        function getIconForObjectType(type) {
            for (let i = 0; i < specif.objectTypes.length; i++)
                if (specif.objectTypes[i].id === type)
                    return specif.objectTypes[i].icon ? specif.objectTypes[i].icon + " " : "";
        }

        /**
         * Returns a string representing the title of an object with the given id.
         * The title is the combination of the objects name and its icon.
         * @param id the id of an object
         * @returns {string} title of the object
         */
        function getObjectTitleForObjectID(id) {
            let object = getObjectForID(id);
            return getIconForObjectType(object.objectType) + getObjectNameForObject(object);
        }

        /**
         * Returns a string representing the name of an object with the given id.
         * @param object the object the name is searched for
         * @returns {string} name of the object
         */
        function getObjectNameForObject(object) {
            for (let n = 0; n < object.attributes.length; n++) {
                if (titleAttributes.includes(object.attributes[n].title)) {
                    return cleanStringFromForbiddenChars(object.attributes[n].value);
                }
            }
            return cleanStringFromForbiddenChars(object.title);
        }

        /**
         * converts all forbidden chars to html unicode
         * @param str String to be checked
         * @returns {string} cleaned string
         */
        function cleanStringFromForbiddenChars(str) {
            str = cleanStringHtmlToUniCode(str);
            let i = str.length,
                aRet = [];
            while (i--) {
                let iC = str[i].charCodeAt(0);
                if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) aRet[i] = '&#' + iC + ';';
                else aRet[i] = str[i];
            }
            return aRet.join('');
        }

        /**
         * Converts html unicode to utf8 unicode
         * @param str String to be checked
         * @returns {string} cleaned string
         */
        function cleanStringHtmlToUniCode(str) {
            return str.replace(/&#([0-9]{1,3});/g, function (match, numStr) {
                return String.fromCharCode(parseInt(numStr, 10));
            });
        }

        /**
         * Creates a confluence xhtml Link object to the given page
         * @param pageTitle the title of the page
         * @returns {string} confluence xhtml link object
         */
        function makeLinkToConfluencePage(pageTitle) {
            return '<ac:link>' +
                '<ri:page ri:content-title="' + pageTitle + '" />' +
                '<ac:plain-text-link-body>' +
                '<![CDATA[' + cleanStringHtmlToUniCode(pageTitle) + ']]>' +
                '</ac:plain-text-link-body>' +
                '</ac:link>';
        }

        /**
         * Returns an object for the given id
         * @param id the id of the object
         * @returns the object for the id or undefined if there is no object
         */
        function getObjectForID(id) {
            for (let i = 0; i < specif.objects.length; i++)
                if (specif.objects[i].id === id) return specif.objects[i];
        }

        /**
         * Returns an object width pattern {relationtype:{targets:[],sources:[]}} containing all targets and sources
         * related to the given object and sorted after relation types
         * @param object The object, where the relations are to
         * @returns {{}}
         */
        function getAllRelationsForObject(object) {
            let relations = {};
            for (let i = 0; i < specif.relations.length; i++) {
                if (specif.relations[i].target.id === object.id || specif.relations[i].source.id === object.id) {

                    let relationType = getRelationType(specif.relations[i]);
                    if (!relations[relationType]) {
                        relations[relationType] = {
                            targets: [],
                            sources: []
                        };
                    }
                    if (specif.relations[i].target.id === object.id) {
                        relations[relationType].sources.push(specif.relations[i].source.id);
                    } else {
                        relations[relationType].targets.push(specif.relations[i].target.id);
                    }
                }
            }
            return relations;
        }

        /**
         * Returns the relation type name for a relation
         * @param relation The relation the name is searched for.
         * @returns string Returns the name for the relationType or the relationType string if no name is found
         */
        function getRelationType(relation) {
            let type = relation.relationType;
            if (relation.attributes) {
                let i = relation.attributes.length;
                while (i--) {
                    if (titleAttributes.includes(relation.attributes[i].title)) {
                        type = relation.attributes[i].value;
                        break;
                    }
                }
            }
            return type
        }

        /**
         * Returns the values array of enumerated Datatypes
         * @param dataType the enumerated dataType
         * @returns array if the data type is enumerated else undefined
         */
        function getValuesForEnumeratedDataType(dataType) {
            for (let i = 0; i < specif.dataTypes.length; i++)
                if (specif.dataTypes[i].id === dataType) return specif.dataTypes[i].values;
        }

        /**
         * Returns the value name for a given enumerated data type and value
         * @param dataType The enumerated data type
         * @param value The value string the name is searched for
         * @returns {string} the name of the value, if there is no value name an empty string is returned
         */
        function getEnumeratorValueForDataTypeAndValue(dataType, value) {
            let values = getValuesForEnumeratedDataType(dataType);
            if (values) {
                for (let i = 0; i < values.length; i++)
                    if (values[i].id === value) return values[i].title;
            }
            return "";
        }

        /**
         * Converts a date value in a Date String
         * @param value date value
         * @returns {string} the converted Date string
         */
        function getDateValueForDataTypeAndValue(value) {
            return new Date(value).toLocaleString();
        }

        /**
         * Returns the value of an attribute with the given title from the given object
         * @param object the object the attribute belongs to
         * @param title the title of the attribute
         * @returns {string} the value or an message that there is no attribute with this value
         */
        function getAttributeValueForTitle(object, title) {
            for (let i = 0; i < object.attributes.length; i++) {
                if (object.attributes[i].title === title) return object.attributes[i].value;
            }
            return "no attribute " + title + " in " + object.id + " available.";
        }

        /**
         * Checks if a data type is enumerator
         * @param type data type
         * @returns boolean
         */
        function dataTypeIsEnumerator(type) {
            return specif.dataTypes.some(function (entry) {
                if (entry.id === type && entry.type === "xs:enumeration")return true;
            });
        }

        /**
         * Checks if a data type is date
         * @param type data type
         * @returns boolean
         */
        function dataTypeIsDate(type) {
            return specif.dataTypes.some(function (entry) {
                if (entry.id === type && entry.type === "xs:dateTime")return true;
            });
        }

        /**
         * Returns all attributes for a given object type as array
         * @param objectType
         * @returns {Array} all attributes or empty array
         */
        function getAllAttributesForObjectType(objectType) {
            let attributes = [];
            for (let i = 0; i < specif.objectTypes.length; i++) {
                if (specif.objectTypes[i].id == objectType) {
                    specif.objectTypes[i].attributeTypes.forEach(function (entry) {
                        if (!titleAttributes.includes(entry.title) &&
                            !descriptionAttributes.includes(entry.title)) attributes.push(entry);
                    });
                }
            }
            return attributes;
        }



        /**
         * returns a object for a given id
         * @param id the object id
         * @returns undefined or the object found by id
         */
        function getSpecIFObjectForID(id) {
            for (let i = 0; i < specif.objects.length; i++)
                if (specif.objects[i].id === id)  return specif.objects[i];
        }

        /**
         * Returns the root node of the specif for a given index
         * @param index the index of the root node
         * @returns returns the root node for the given index, if no index is given then index =0
         */
        function getRoot(index) {
            if (index) return specif.hierarchies[index];
            return specif.hierarchies[0];
        }

        /**
         * Returns the stringify json object for the given Relations and object
         * @param relations the given relations
         * @param object the given object
         * @returns string stringify json object of the relations
         */
        function getStringifyJsonForRelations(relations, object) {
            let relationJson = {};
            relationJson.pageTitle = getObjectTitleForObjectID(object.id).replace(/&#34;/g, "&#39;");
            for (let i = 0; i < specif.relationTypes.length; i++) {
                let relation = specif.relationTypes[i];
                let title = getRelationTitle(relation);
                if (relations[relation.id]) {
                    if (!relationJson[title]) relationJson[title] = {targets: [], sources: []};

                    if (relations[relation.id].sources.length > 0) {
                        relations[relation.id].sources.forEach(function (entry) {
                            relationJson[title].sources.push(getObjectTitleForObjectID(entry).replace(/&#34;/g, "&#39;"));
                        });
                    }
                    if (relations[relation.id].targets.length > 0) {
                        relations[relation.id].targets.forEach(function (entry) {
                            relationJson[title].targets.push(getObjectTitleForObjectID(entry).replace(/&#34;/g, "&#39;"));
                        });
                    }

                }
            }
            return JSON.stringify(relationJson);
        }

        /**
         * Returns a html string containing all relations for a given object
         * @param object The object the relations html has to be created for.
         * @returns {string} the relations html
         */
        function getRelationsAsHtmlStringForObject(object) {
            let relations = getAllRelationsForObject(object);
            let relationsDiv =
                '<div title="specifRelations"><br/><br/><br/><h3>' + i18n.RELATIONS + '</h3>' +
                '<ac:structured-macro ac:name="specif-graph" ' +
                'ac:schema-version="1" ac:macro-id="bd7db971-d655-40bd-a1de-119bd890803d"/>' +
                '<hr/>';

            for (let i = 0; i < specif.relationTypes.length; i++)
                relationsDiv += getRelationsAsHtmlStringForRelationTypeAndObject(
                    object,
                    specif.relationTypes[i],
                    relations)
            relationsDiv += '</div>';
            if ($.isEmptyObject(relations)) relationsDiv = "";
            else relationsDiv += '<p class="hidden">' + getStringifyJsonForRelations(relations, object) + '</p>';
            return relationsDiv;
        }

        /**
         * Returns the relation title for a given relation
         * @param relation
         * @returns the title of the relation. If no title is found then return the relation title type
         */
        function getRelationTitle(relation) {
            let type = getRelationType(relation);
            let i = specif.relationTypes.length;
            while (i--) {
                if (specif.relationTypes[i].id === type) {
                    return specif.relationTypes[i].title;
                }

            }
            return relation.title;
        }

        /**
         * returns for each relation the needed html string
         * @param object The object the relation is related to
         * @param relation The specific relation
         * @param relations all relations of the given object
         * @returns {string} the created html string
         */
        function getRelationsAsHtmlStringForRelationTypeAndObject(object, relation, relations) {
            let relationsDiv = "";
            if (relations[relation.id]) {
                let title = getRelationTitle(relation);
                let middleSideDiv = '<ac:layout-cell><p id="middle" title ="' + title + '"><em>' + title + '</em></p></ac:layout-cell>';
                let pageTitle = getObjectTitleForObjectID(object.id);
                let unlinkedRelationObject = '<ac:layout-cell><p>' + pageTitle +
                    '</p></ac:layout-cell>';
                if (relations[relation.id].sources.length > 0) {
                    relationsDiv += '<ac:layout><ac:layout-section ac:type="three-equal" >' +
                        getAllLinkedRelationsOfOneSideAsHtmlStringForRelationsArray(relations[relation.id].sources)
                        + middleSideDiv + unlinkedRelationObject + '</ac:layout-section></ac:layout><hr/>';
                }
                if (relations[relation.id].targets.length > 0) {
                    relationsDiv += '<ac:layout><ac:layout-section ac:type="three-equal">' +
                        unlinkedRelationObject + middleSideDiv +
                        getAllLinkedRelationsOfOneSideAsHtmlStringForRelationsArray(relations[relation.id].targets) +
                        '</ac:layout-section></ac:layout><hr/>';
                }
            }
            return relationsDiv;
        }

        /**
         * Returns for all given relations a confluence xhtml link to the page of this relation
         * @param relArray The given relations
         * @returns the html string
         */
        function getAllLinkedRelationsOfOneSideAsHtmlStringForRelationsArray(relArray) {
            let side = '<ac:layout-cell>';
            relArray.forEach(function (entry) {
                let pageTitle = getObjectTitleForObjectID(entry);
                side += '<p>' + makeLinkToConfluencePage(pageTitle) + '</p>';
            });
            return side + '</ac:layout-cell>';
        }

        /**
         * Returns a html string containing all attributes for a given object
         * @param object The object the attributes html has to be created for.
         * @returns {string} the attributes html
         */
        function getAttributesAsHtmlStringForObject(object) {
            let attributesDivLeft = "<ac:layout-cell>";
            let attributesDivRight = "<ac:layout-cell>";
            getAllAttributesForObjectType(object.objectType).forEach(function (attribute) {
                let value = getAttributeValueForTitle(object, attribute.title);

                if (dataTypeIsEnumerator(attribute.dataType))
                    value = getEnumeratorValueForDataTypeAndValue(attribute.dataType, value);
                if (dataTypeIsDate(attribute.dataType))
                    value = getDateValueForDataTypeAndValue(value);
                attributesDivLeft += '<p style="text-align: right;"><span style="color: rgb(102,102,153);"><em>' +
                    attribute.title + '</em></span></p>';
                attributesDivRight += '<p>' + value + '</p>';
            });
            attributesDivLeft += "</ac:layout-cell>";
            attributesDivRight += "</ac:layout-cell>";
            return '<div><br/><br/><br/><h3>' + i18n.ATTRIBUTES + '</h3><hr/><ac:layout><ac:layout-section ac:type="two-equal">' +
                attributesDivLeft + attributesDivRight +
                '</ac:layout-section></ac:layout><hr/></div>';
        }

        /**
         * Creates the unique page tittle for the  given object.
         * Because confluence uses page title as unique identifier there can be no page title a second time.
         * But it is needed that a page with the same title exists multiple times. To achieve that, this function adds
         * to each space title a empty unicode string as many times as this page is duplicated.
         * @param object The given Object
         * @returns {string} The unique page title
         */
        function makePageTitle(object) {
            let title = cleanStringHtmlToUniCode(getObjectTitleForObjectID(object.id));
            if (duplicatedPageTitles[title]) duplicatedPageTitles[title]++;
            else duplicatedPageTitles[title] = 1;
            let simpleTitle = title;
            for (let i = 0; i < duplicatedPageTitles[simpleTitle] - 1; i++)
                title += "\u200B";

            return title;
        }

        /**
         * Returns the number of pages that have to be created
         * @param node The root node
         * @returns {number} The number of pages that have to be created
         */
        function getHierarchieNodesSize(node) {
            if (node.nodes.length == 0) return 1;
            let count = 0;
            node.nodes.forEach(function (entry) {
                count += getHierarchieNodesSize(entry);
            });
            return count + 1;
        }

        /**
         * Returns the SpecIFZ file including the image files from the zip
         * @returns {Array} The SpecIFZ File
         */
        function getFiles() {
            return specifZ;
        }

        /**
         * Return the specif json file
         * @returns {*} The specif json file
         */
        function getSpecIF() {
            return specif;
        }

        /**
         * Checks if a given object is chapter or not
         * @param object the given object
         * @returns {boolean}
         */
        function isChapter(object) {
            for (let n = 0; n < object.attributes.length; n++) {
                if (object.attributes[n].title.match("SpecIF:Heading") ||
                    object.attributes[n].title.match("ReqIF.ChapterName")) {
                    return true;
                }
            }
            return false;
        }

        /**
         * returns the title of the specif json file
         * @returns the title of the specif json file
         */
        function getTitle() {
            return specif.title;
        }

        return {
            getSpecIFObjectForID: getSpecIFObjectForID,
            getRoot: getRoot,
            getRelationsAsHtmlStringForObject: getRelationsAsHtmlStringForObject,
            getAttributesAsHtmlStringForObject: getAttributesAsHtmlStringForObject,
            makePageTitle: makePageTitle,
            getFiles: getFiles,
            getSpecIF: getSpecIF,
            getHierarchieNodesSize: getHierarchieNodesSize,
            isChapter: isChapter,
            getTitle: getTitle

        }

    };


});