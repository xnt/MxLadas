(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var codesResults = new WinJS.Binding.List();
    var mlMembers = { ItemList: codesResults };
    WinJS.Namespace.define("ml", mlMembers);
    var MxLadas = MxLadas || {};
    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            loadPrototypes();
            args.setPromise(WinJS.UI.processAll().then(
                function () {
                    console.info("UI elements processed. Loading Resources...");
                    WinJS.Resources.processAll().then(function () {
                        console.info("Resources loaded. Loading codes...");
                        MxLadas.loadCodes();
                        console.info("Codes loaded.");
                        addEventListeners();
                    });
                }
                ));
        }
    };

    /**
     * Loads the prototype extensions we're going to use on this app
     * TODO: Move to another file
     */
    var loadPrototypes = function () {
        if (typeof String.prototype.startsWith != 'function') {
            String.prototype.startsWith = function (str) {
                return this.slice(0, str.length) == str;
            };
        }
        if (typeof String.prototype.contains != 'function') {
            String.prototype.contains = function (str) {
                return this.toUpperCase().indexOf(str.toUpperCase()) != -1;
            };
        }
    }

    /**
     * Attaches the event listener(s) in this app
     */
    var addEventListeners = function () {
        searchBtn.addEventListener("click", MxLadas.doSearch, false);
    }

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();

    /**
     * Returns a string representation of a Code Entry
     */
    MxLadas.codeEntryToString = function (codeEntry) {
        return codeEntry.Locality + " > " + codeEntry.Code;
    }

    /**
     * Loads all te codes from the JSON
     */
    MxLadas.loadCodes = function () {
        // Get the file
        var myUrl = new Windows.Foundation.Uri('ms-appx:///resources/codes.json');
        console.info(Windows.ApplicationModel.Package.current.installedLocation.path);
        console.info(Windows.Storage.ApplicationData.current.localFolder.path);
        console.info("Uri created");
        Windows.Storage.StorageFile.getFileFromApplicationUriAsync(myUrl).done(function (file) {
            console.info("File loaded");
            // Read data
            Windows.Storage.FileIO.readTextAsync(file).then(function (text) {
                console.info("Text loaded. Creating object");
                MxLadas.codes = eval(text); // Diugh...
                console.info("Object created");
                // Changes the button from "Loading" to "Search"
                searchBtn.textContent = WinJS.Resources.getString("search").value;
                console.info("Button text changed");
            }, MxLadas.errorHandler);
        }, MxLadas.errorHandler);
    }

    /**
     * Generic error handler. Log the error, display it to the user
     */
    MxLadas.errorHandler = function (error) {
        console.error(error);
        var messDialog = new Windows.UI.Popups.MessageDialog(error);
        messDialog.showAsync();
    };

    /**
     * Performs the search itself
     */
    MxLadas.doSearch = function () {
        /**
         * Logs a matched entry, pushes it to the array
         */
        var logAndPush = function (what) {
            console.info("Found thing: " + MxLadas.codeEntryToString(what));
            codesResults.push(MxLadas.asObject(what));
        }

        // Clear the array, trim and get the value, log
        codesResults.splice(0, codesResults.length);
        var searchTxt = searchTerm.value;
        searchTxt = searchTxt.trim();
        console.info("Search text: " + searchTxt);
        if (!isNaN(parseInt(searchTxt)) && isFinite(searchTxt)) { // Number. Look for codes
            for (var i = 0; i < MxLadas.codes.length; i++) {
                if (MxLadas.codes[i].Code.startsWith(searchTxt)) {
                    logAndPush(MxLadas.codes[i]);
                }
            }
            //document.getElementById("resultsSection").dataSource = codesResults;
        } else { // Text, look for localities
            for (var i = 0; i < MxLadas.codes.length; i++) {
                // This is going to hurt, but some people are lazy (and some places have similar names)
                if (MxLadas.codes[i].Locality.contains(searchTxt)) {
                    logAndPush(MxLadas.codes[i]);
                }
            }
        }
    }

    /**
     * For some reason our happy, JSON-loaded object couldn't be loaded in the datasource. So well...
     */
    MxLadas.asObject = function (entry) {
        var objEntry = new Object();
        objEntry.Code = entry.Code;
        objEntry.Locality = entry.Locality;
        return objEntry;
    }

    /**
     * How will the search result be displayed on the results list?
     */
    MxLadas.formatSearchResult = function (result) {
        var formattedResult = "";
        for (var i = 0; i < result.length; i++) {
            // This is when I miss jQuery. Too lazy to use the DOM API directly (TODO)
            formattedResult += ("<div class='resultDiv'>" + 
                "<span class='resultCode'>" + result[i].Code + "</span>&nbsp;" +
                "<span class='resultLocality'>" + result[i].Locality + "</span>" +
                "</div>");
        }
        return formattedResult;
    }
})();
