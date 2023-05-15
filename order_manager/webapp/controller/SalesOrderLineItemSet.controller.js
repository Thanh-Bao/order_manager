sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/f/library",
    "sap/ui/core/UIComponent"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, fioriLibrary, UIComponent) {
    "use strict";

    return Controller.extend("ordermanager.controller.SalesOrderLineItemSet", {
        onInit: function () {

            UIComponent.getRouterFor(this).attachRouteMatched(this.routeMatched, this);
            this.oView = this.getView();
            this._bDescendingSort = false;
            this.oProductsTable = this.oView.byId("tbSalesOrderLineItemSet");

            const oStateModel = new JSONModel({
                SalesOrderLineItemSet: [],
                SalesOrderSet: null
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
                success: (results) => {
                    console.log(results)
                    oSalesOrderSet.setProperty(`/SalesOrderSet`, results);
                },
                error: function () {
                    oSalesOrderSet.setProperty("/SalesOrderSet", null);
                }
            })

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
        onListItemPress: function () {
            var oFCL = this.oView.getParent().getParent();

            oFCL.setLayout(fioriLibrary.LayoutType.TwoColumnsMidExpanded);
        }
    });
});