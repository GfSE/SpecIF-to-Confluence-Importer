define(["purl"], function(purl) {
    var contextPath = purl().param("cp");
    var host = purl().param("xdm_e");

    return {
        baseUrl: host + contextPath
    }
});