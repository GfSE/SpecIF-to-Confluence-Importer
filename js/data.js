define(function () {
    return {
        removeSpace: function (spaceKey, callback, onError) {
            AP.request({
                url: "/rest/api/space/" + spaceKey,
                type: "DELETE",
                success: callback,
                error: onError
            });
        },
        waitForCompleteDeletion: function (url, callback, onError) {
            AP.request({
                url: url,
                type: "GET",
                success: callback,
                error: onError
            });
        },
        addSpace: function (data, callback, onError) {
            AP.request({
                url: "/rest/api/space/",
                contentType: "application/json",
                type: "POST",
                data: JSON.stringify(data),
                success: callback,
                error: onError
            });
        },
        getSpaces: function (callback, onError) {
            AP.request({
                url: "/rest/api/space/",
                type: "GET",
                success: callback,
                error: onError
            });
        },
        getSpace: function (key,callback, onError) {
            AP.request({
                url: "/rest/api/space/"+key+"?expand=homepage",
                type: "GET",
                success: callback,
                error: onError
            });
        },
        createPage: function (data, callback, onError) {
            AP.request({
                url: "/rest/api/content/",
                contentType: "application/json",
                type: "POST",
                data: JSON.stringify(data),
                success: callback,
                error: onError
            });

        },
        getPage: function (pageID, callback, onError) {
            AP.request({
                url: "/rest/api/content/" + pageID,
                type: "GET",
                success: callback,
                error: onError
            });
        },
        getPageExpand: function (pageID,expand, callback) {
            AP.request({
                url: "/rest/api/content/" + pageID+ expand,
                type: "GET",
                success: callback
            });
        },
        updatePage: function (pageID, data, callback, onError) {
            AP.request({
                url: "/rest/api/content/" + pageID,
                contentType: "application/json",
                type: "PUT",
                data: JSON.stringify(data),
                success: callback,
                error: onError
            });
        },
        addAttachment: function (pageID, data, callback, onError) {
            AP.request({
                url: "/rest/api/content/" + pageID + "/child/attachment",
                type: "POST",
                data: data,
                contentType: "multipart/form-data",
                headers: {"X-Atlassian-Token": "no-check"},
                success: callback,
                error: onError
            });

        }
    }
});