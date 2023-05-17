sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/f/library",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, fioriLibrary, UIComponent, History) {
    "use strict";

    return Controller.extend("ordermanager.controller.SalesOrderLineItemSet", {
        onInit: function () {

            UIComponent.getRouterFor(this).attachRouteMatched(this.routeMatched, this);
            this.oView = this.getView();
            this._bDescendingSort = false;
            this.oProductsTable = this.oView.byId("tbSalesOrderLineItemSet");

            const oStateModel = new JSONModel({
                SalesOrderLineItemSet: [],
                SalesOrderSet: null,
                ToBusinessPartner: null,
                ProductDetail: null,
                isEnableButton: {
                    confirm: false,
                    issue: false,
                    invoice: false,
                    cancel: true
                }
            });


            this.getView().setModel(oStateModel, "customSalesOrderLineItemSet");
        },

        routeMatched: function (oEvent) {
            const SalesOrderID = oEvent.getParameter("arguments").SalesOrderID;
            const oView = this.getView();
            const oTable = oView.byId("tbSalesOrderLineItemSet");
            const oModel = oView.getModel();
            const oSalesOrderSet = oView.getModel('customSalesOrderLineItemSet');

            oTable.setBusy(true);

            oModel.read(`/SalesOrderSet('${SalesOrderID}')`, {
                success: results => {
                    oSalesOrderSet.setProperty(`/SalesOrderSet`, results);
                    switch (results.DeliveryStatus) {
                        case 'D':
                            oSalesOrderSet.setProperty("/isEnableButton/invoice", true);
                            break;

                        default:
                            break;
                    }
                },
                error: function () {
                    oSalesOrderSet.setProperty("/SalesOrderSet", null);
                }
            })
            // Product List
            oModel.read(`/SalesOrderSet('${SalesOrderID}')/ToLineItems`, {
                urlParameters: {
                    $expand: "ToProduct"
                },
                success: ({ results }) => {
                    oTable.setBusy(false)
                    oSalesOrderSet.setProperty(`/SalesOrderLineItemSet`, results);
                },
                error: function () {
                    oTable.setBusy(false)
                    oSalesOrderSet.setProperty("/SalesOrderLineItemSet", []);
                }
            })

            // Partner
            oModel.read(`/SalesOrderSet('${SalesOrderID}')/ToBusinessPartner`, {
                urlParameters: {
                    $expand: "ToContacts"
                },
                success: partner => {
                    oTable.setBusy(false)
                    oSalesOrderSet.setProperty(`/ToBusinessPartner`, partner);
                },
                error: function () {
                    oTable.setBusy(false)
                    oSalesOrderSet.setProperty("/ToBusinessPartner", []);
                }
            })

        },

        onSearch: function (oEvent) {
            var oTableSearchState = [],
                sQuery = oEvent.getParameter("query");

            if (sQuery && sQuery.length > 0) {
                oTableSearchState = [new Filter("ProductID", FilterOperator.Contains, sQuery)];
            }

            this.oProductsTable.getBinding("items").filter(oTableSearchState, "Application");
        },

        onSort: function () {
            this._bDescendingSort = !this._bDescendingSort;
            var oBinding = this.oProductsTable.getBinding("items"),
                oSorter = new Sorter("ItemPosition", this._bDescendingSort);

            oBinding.sort(oSorter);
        },
        onListItemPress: function (ProductID) {
            const oView = this.getView();
            oView.getModel('customSalesOrderLineItemSet').setProperty(`/ProductDetail`, null);
            oView.byId("dialogProductInfo").open();
            oView.getModel().read(`/ProductSet('${ProductID}')`, {

                success: product => {
                    oView.getModel('customSalesOrderLineItemSet').setProperty(`/ProductDetail`, product);
                },
                error: function () {

                }
            })
        },
        dialogProductDetailClose: function () {
            this.getView().byId("dialogProductInfo").close();

        },
        openMapInNewWindows: function (Address) {
            window.open(`https://www.google.com/maps/search/${Address.Street},${Address.City},${Address.Country}`, '_blank', 'location=yes,height=570,width=1000,scrollbars=yes,status=yes');
        },
        openMapInNewTab: function (Address) {
            var sAddress = `${Address.Street},${Address.City},${Address.Country}`;
            var sApiKey = "AIzaSyCHu1KtJDdEnvE069-OQk_ytOuGuySUESo";



            // Load the Google Maps API script
            var script = document.createElement("script");
            script.src = "https://maps.googleapis.com/maps/api/js?key=" + sApiKey + "&libraries=places";
            script.onload = function () {
                // Create the dialog
                var oDialog = new sap.m.Dialog({
                    title: "Business Partner Location",
                    contentWidth: "800px",
                    contentHeight: "600px",
                    verticalScrolling: false,
                    horizontalScrolling: false,
                    content: [
                        new sap.ui.core.HTML({
                            content: "<div id='mapCanvas' style='width: 100%; height: 100%;'></div>"
                        })
                    ],
                    endButton: new sap.m.Button({
                        text: "Close",
                        press: function () {
                            oDialog.close();
                        }
                    }),
                    afterOpen: function () {
                        // Geocode the address and display the map
                        geocodeAddress(sAddress);
                    }
                });



                // Open the dialog
                oDialog.open();
            };



            // Append the script to the document
            document.head.appendChild(script);



            // Geocode address and display map
            function geocodeAddress(address) {
                // Create a geocoder instance
                var geocoder = new google.maps.Geocoder();



                // Geocode the address
                geocoder.geocode({ address: address }, function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
                        var latitude = results[0].geometry.location.lat();
                        var longitude = results[0].geometry.location.lng();



                        // Display the map
                        displayMap(latitude, longitude);
                    } else {
                        // Handle geocoding errors
                        console.error("Geocoding failed. Status: " + status);
                    }
                });
            }



            // Display the map with the given coordinates
            function displayMap(latitude, longitude) {
                var mapCanvas = document.getElementById("mapCanvas");



                // Create a map instance
                var map = new google.maps.Map(mapCanvas, {
                    center: { lat: latitude, lng: longitude },
                    zoom: 15
                });



                // Create a marker at the business partner location
                var marker = new google.maps.Marker({
                    position: { lat: latitude, lng: longitude },
                    map: map,
                    title: "Business Partner Location"
                });
            }
        },

        SOinvoiceHander: function (SalesOrderID) {
            // this.getView().getModel().create("/SalesOrderSetSalesOrder_InvoiceCreated", {
            //     urlParameters: {
            //         SalesOrderID: "0500000999"
            //     },
            //     success: () => console.log("hello"),
            //     error: err => console.log(err)
            // });
            this.getView().getModel().callFunction("/SalesOrder_InvoiceCreated", {
                method: "POST",
                urlParameters: { SalesOrderID: SalesOrderID },
                sucess: function (oData, response) { console.log("hje") },
                error: function (oError) { }
            });
        },

        cancelHander: function () {
            this.getOwnerComponent().getRouter().navTo('RouteSalesOrderSet');
        }
    });
});