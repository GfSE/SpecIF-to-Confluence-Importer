/**
 * Created by Marcus Bätz on 13.04.2017.
 */
define(["jquery", "host"], function($, host) {
    let script = document.createElement("script");

    $(function () {
        script.src = host.baseUrl + '/atlassian-connect/all.js';
        script.setAttribute('data-options', "sizeToParent:true");
        document.getElementsByTagName("head")[0].appendChild(script);
    });

    return $(script);
});