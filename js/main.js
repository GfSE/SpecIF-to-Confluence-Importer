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
    require(["ap-loader", "controller","old-browser-helper"], function(apLoader,controller,helper) {
        helper();
        controller.init();
        // apLoader.load(function() {
        //     console.log("hello");
        //     $(window).one("resize", function() {
        //         console.log("load init");
        //         controller.init();
        //     });
        // });

    });
});