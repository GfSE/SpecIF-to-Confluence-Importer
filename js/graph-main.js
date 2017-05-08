/**
 * Created by Marcus Bätz on 13.04.2017.
 */
// let jQuery = window.jQuery;
// console.log(jQuery);
// define('jquery',[],function () {
//     return jQuery;
// });
// $(document).ready(function () {
//     console.log("DOM fully loaded and parsed");
// });
require(["config"], function() {
    require(["ap-loader", "graph","old-browser-helper"], function(apLoader,graph,helper) {
        helper();
        graph.init();
        // apLoader.load(function() {
        //
        //         graph.init();
        //
        // });

    });
});