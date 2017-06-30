'use strict';

angular.module('pastac-edit-supplier', [])

.component('pastacEditSupplier', {
  controller: PastacEditSupplierController,
  controllerAs: 'ctrl',
  bindings: {
    // Bind parameters from the HTML element that invokes this
    // See https://docs.angularjs.org/guide/component
    handler: '<',       // object with callbacks
    jwt: '<',           // The JSON web token
    supplierId: '<',  // string, such as 'Vendor'
    showProducts: '<',  // boolean
    backButton: '<',  // boolean
    template: '@'
  },

  templateUrl: function($element, $attrs) {
    var t = '/bower_components/pastac-edit-supplier/dist/pastac-edit-supplier.html';
    if ($attrs.template) {
      t = $attrs.template;
    }
    //console.log('template=>' + t);
    return t;
  },

});


function PastacEditSupplierController($scope, $timeout, $http, $compile) {
  var ctrl = this;
  var _supplierId = null;

  var LABEL = 'Supplier List';
  var SUPPLIER_VIEW = 'supplier';
  var SUPPLIER_METADATA = null;


  ctrl.teaContext = {
    $scope: $scope,
    $http: $http,
    $timeout: $timeout,
    $compile: $compile,
    TEASERVICE_HOST: TEASERVICE_HOST,
    TEASERVICE_PORT: TEASERVICE_PORT,
    TEASERVICE_VERSION: TEASERVICE_VERSION,
    TEASERVICE_ACCESS_TOKEN: TEASERVICE_ACCESS_TOKEN,
    STORE_ID: 6
  };



  ctrl.$onInit = function() {

  };//- $onInit




  // Called when the supplierId passed to this component changes
  ctrl.$onChanges = function(changesObj) {
    console.log('changed', changesObj);

    // See if the user wants to be notified of changes
    var callback = (ctrl.handler && ctrl.handler.onAddSupplier) ? ctrl.handler.onAddSupplier : null;

    if (ctrl.supplierId != _supplierId) {
      console.log('SupplierId has changed');
      _supplierId = ctrl.supplierId;

      loadSupplier($http, ctrl.jwt, ctrl.supplierId, null);
    }
  }//- $onChanges


  // Called when the back button is pressed
  ctrl.doBack = function() {
    if (ctrl.handler && ctrl.handler.onBack) {
      ctrl.handler.onBack();
    }
  }//- doBack()


  /*
   *  Save the supplier details.
   */
  ctrl.doSave = function() {
    console.log('doSave()');

    // Update the basic details
    console.log('rec is ', ctrl.supplier);

    TooltwistViews.save(ctrl.teaContext, SUPPLIER_METADATA, 'record', ctrl.supplier, function(err, reply) {
      console.log('save returned', err, reply);
      if (err) {
        console.log('Error selecting view ' + SUPPLIER_VIEW + '/record', err);
        return;
      }
    });

    // Update the story
    TooltwistViews.save(ctrl.teaContext, SUPPLIER_METADATA, 'story', ctrl.supplier, function(err, reply) {
      console.log('story save returned', err, reply);
      if (err) {
        console.log('Error selecting view ' + SUPPLIER_METADATA + '/story', err);
        return;
      }
    });

    // If we are an administrator, update those values as well
    if (true) {
    // if ($scope.currentUser.isAdmin) {//ZZZZ Need to save this
      TooltwistViews.save(ctrl.teaContext, SUPPLIER_METADATA, 'admin', ctrl.supplier, function(err, reply) {
        console.log('admin save returned', err, reply);
        if (err) {
          console.log('Error selecting view ' + SUPPLIER_VIEW + '/admin', err);
          return;
        }
      });
    }

    // context.$timeout(function() {
    //   context.$scope.supplier2_showListPane = true;
    // }, 10);
  }//- doSave()


  // Called when a product is selected.
  ctrl.doSelectProduct = function(product) {
    console.log('ctrl.selectProduct()');

    if (ctrl.handler && ctrl.handler.onSelectProduct) {
      ctrl.handler.onSelectProduct(product.productId);
    }
  }//- selectProduct()


  function loadSupplier($http, jwt, supplierId, callback/*(successResponse,errorResponse)*/) {
    console.log('loadSupplier:', supplierId);

    var params = {
      //withReferences: false,
      where: {
        id: supplierId
      }
    }


    TooltwistViews.select(ctrl.teaContext, SUPPLIER_VIEW, params, function selected(err, data, metadata) {
      if (err) {
        console.log('Error selecting view ' + SUPPLIER_VIEW, err);
        return;
      }
      SUPPLIER_METADATA = metadata;
      console.log('SUPPLIER_METADATA=', metadata);
      console.log('data=', data);
      console.log('metadata=', metadata);

      //ctrl.supplier2_list = data;
      ctrl.supplier = (data.length > 0) ? data[0] : null;
      ctrl.viewLabel = metadata.label;

      /*
       *  Initialize ckeditor, using angular-ckeditor.
       *  See https://github.com/lemonde/angular-ckeditor
       *  The Toolbar can be configured using the toolbar configurator utility
       *  at bower_components/ckeditor/samples/toolbarconfigurator/index.html
       */
      ctrl.ckeditorOptions = {
          language: 'en'
      };
      ctrl.ckeditorOptions.toolbarGroups = [
    		{ name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
    		{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
    		{ name: 'links', groups: [ 'links' ] },
    		{ name: 'insert', groups: [ 'insert' ] },
    		{ name: 'forms', groups: [ 'forms' ] },
    		{ name: 'tools', groups: [ 'tools' ] },
    		{ name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
    		{ name: 'others', groups: [ 'others' ] },
    		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
    		{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
    		{ name: 'styles', groups: [ 'styles' ] },
    		{ name: 'colors', groups: [ 'colors' ] },
    		{ name: 'about', groups: [ 'about' ] }
    	];
    	ctrl.ckeditorOptions.removeButtons = 'Underline,Subscript,Superscript,Strike,Maximize,Image,Table,HorizontalRule,SpecialChar,Link,Unlink,Anchor,Scayt,PasteFromWord,PasteText,Source,Styles,Format,About,Blockquote';



      // Provide style options for displaying the list and record.
      var displayOptions = {
        listModel: 'supplier2_list',
        listTableClasses: 'table-condensed table-hover',
        listClickFunction: 'supplier2_listClick',
        recordScope: 'ctrl',
        recordModel: 'supplier',
      };

      // // Add fields to the DOM for the list
      // var listDiv = $('#supplier2_listDiv');
      // var fields = TooltwistViews.fieldsForMode(metadata, 'list');
      // var html = TooltwistViews.htmlForAngular_list(metadata, fields, displayOptions);
      // listDiv.html(html);
      // // Ask Angular to bind our new DOM elements onto it's models.
      // $compile(listDiv)($scope);

      // Add fields to the DOM for the record
      var recordDiv = $('#supplier2_recordDiv');
      var fields = TooltwistViews.fieldsForMode(metadata, 'record');
      var html = TooltwistViews.htmlForAngular_edit(metadata, fields, displayOptions);
      console.log('html=', html);
      recordDiv.html(html);
      // Ask Angular to bind our new DOM elements onto it's models.
      $compile(recordDiv)($scope);

      // If this is an admin user, show admin-only fields.
      // if ($scope.currentUser.isAdmin) {
      if (true) {//ZZZZ
        console.log('WARNING, Commission rate should only be editable by admin');
        // Add fields to the DOM for the record
        var recordDiv = $('#supplier2_adminDiv');
        var fields = TooltwistViews.fieldsForMode(metadata, 'admin');
        var html = TooltwistViews.htmlForAngular_edit(metadata, fields, displayOptions);
        recordDiv.html(html);
        // Ask Angular to bind our new DOM elements onto it's models.
        $compile(recordDiv)($scope);
      }

      // Set the current record.
      // Show the single record pane.
      // Set the label for the pane.
      // $scope.supplier2_record = record;
console.log('Set record:', ctrl.supplier);
      // $scope.supplier2_showListPane = false;
      ctrl.headingForRecordPane = (ctrl.supplier) ? ctrl.supplier.supplier_name : '';

      // Perhaps load products for this supplier
      if (ctrl.showProducts) {
        loadProductsForSupplier($scope, ctrl.teaContext, ctrl.supplier.id);
      }

    });


  }//- loadSupplier()




  /*
   *  Load the list of products that match a filter.
   */
  function loadProductsForSupplier($scope, context, supplierId) {
    console.log('loadProductsForSupplier(' + supplierId + ')');

    // var filter = 'broken';
    // if (filter.length < 3) {
    //   ctrl.products = [ ];
    //   return;
    // }

    ctrl.products = [ ];

    // Prepare the URL to Teaservice
    var protocol = 'http';
    var host = ctrl.teaContext.TEASERVICE_HOST;
    var port = ctrl.teaContext.TEASERVICE_PORT;
    var baseUrl = protocol + '://' + host + ':' + port;
    var url = baseUrl + '/philChristmas/product';
    console.log('url is ' + url)

    var params = {
      //productVariantId: 6180,
      supplierId: supplierId
    };

    // Call the API to get the product details
    // ZZZZ This should use JSONP, as some browsers do not support CORS.
    // ZZZZ Unfortunately JSONP does not support headers, so we need
    // ZZZZ to pass details either in the url or the data. i.e. the
    // ZZZZ server requires changes.
    var req = {
      method: 'POST',
      url: url,
      headers: {
        "access-token": "0613952f81da9b3d0c9e4e5fab123437",
        "version": "2.0.0"
      },
      data: params
    };

    // Prepare the promise, so the caller can use .then(fn) to handle the result.
    var promise = $http(req).then(function(response) {
      console.log('success:', response)

      ctrl.products = response.data;
      $timeout(function() {
        $scope.$apply();
      }, 2000);
      //return response.data;

    }, function(response) {
      alert('An error occurred calling the TEA API.\nSee the Javascript console for details.')
      console.log('failure:', response)
      console.log('failure:', response.data.message);
    });

  }//- loadProductsForSupplier()


  /*
   *

   companyName
   supplierName
   storeId
   commissionRate
   logo
   banner
   isActive
   deleted
   type
   contactEmail
   abn
   phone_c
   phone_n
   story

   */
  function addSupplier($http, jwt, options, callback/*(successResponse,errorResponse)*/) {
    console.log('addSupplier()')
    console.log('options: ', options);

    var url = '//' + TEASERVICE_HOST + ':' + TEASERVICE_PORT + '/v3/saveSupplier';
    console.log('url=' + url);

    var req = {
      method: 'PUT',
      url: url,
      headers: {
        "Authorization": jwt,
        "access-token": "0613952f81da9b3d0c9e4e5fab123437",//ZZZZ Hack
        "version": "3.0.0"
      },
      data: options
    };

    // Prepare the promise, so the caller can use .then(fn) to handle the result.
    ctrl.inProgress = true;
    $http(req).then(function(response) {

      // Added okay
      ctrl.inProgress = false;
      ctrl.errmsg = null;
      $('#add-supplier-modal').modal('hide');
      if (callback) {
        return callback(response.data, null)
      }
    }, function(response) {

      // An error occurred
      ctrl.inProgress = false;
      console.log('--------------------------------');
      console.log('Error calling TEAservice:');
      console.log(' Url=' + url);
      console.log(' Request=', req);
      console.log(' Response=', response);
      console.log('--------------------------------');
      if (response.data && response.data.code && response.data.message) {
        var msg = 'Error: ' + response.data.code + ': ' + response.data.message;
      } else if (response.statusText) {
        var msg = 'Error: ' + response.statusText;
      } else {
        var msg = 'Error: ' + response.status;
      }
      ctrl.errmsg = msg;
      if (callback) {
        return callback(null, response)
      }
    });
  }

}
