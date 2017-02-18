requirejs.config({
    "baseUrl": "scripts",
    "paths": {
        "app": ".",
        "spectrum": "spectrum",
        "jquery": "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min"
    }
});
requirejs(["app/main"]);