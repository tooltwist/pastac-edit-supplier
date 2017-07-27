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


function PastacEditSupplierController($scope, $timeout, $http, $compile, Upload) {
  var ctrl = this;
  var _supplierId = null;
  var cl = null; // Cloudinary API

  var LABEL = 'Supplier List';
  var SUPPLIER_VIEW = 'supplier';
  var SUPPLIER_METADATA = null;
  var PRODUCT_VIEW = 'product';
  var PRODUCT_METADATA = null;


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
    //var callback = (ctrl.handler && ctrl.handler.onAddSupplier) ? ctrl.handler.onAddSupplier : null;

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

      // Call the user handler
      if (!ctrl.handler) {
        console.log('Not calling handler.onLoadSupplier (no handler)');
      } else if (!ctrl.handler.onLoadSupplier) {
        console.log('Not calling handler.onLoadSupplier (no handler.onLoadSupplier)');
      } else {
        ctrl.handler.onLoadSupplier(ctrl.supplier);
      }

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

        // Add fields to the DOM for the record
        var div = $('#supplier2_contractualDiv');
        var fields = TooltwistViews.fieldsForMode(metadata, 'contractual');
        var html = TooltwistViews.htmlForAngular_edit(metadata, fields, displayOptions);
        console.log('html=', html);
        div.html(html);
        // Ask Angular to bind our new DOM elements onto it's models.
        $compile(div)($scope);



        // console.log('WARNING, Commission rate should only be editable by admin');
        // // Add fields to the DOM for the record
        // var recordDiv = $('#supplier2_adminDiv');
        // var fields = TooltwistViews.fieldsForMode(metadata, 'admin');
        // var html = TooltwistViews.htmlForAngular_edit(metadata, fields, displayOptions);
        // recordDiv.html(html);
        // // Ask Angular to bind our new DOM elements onto it's models.
        // $compile(recordDiv)($scope);
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
        loadProductsForSupplier(ctrl.supplier.id);
      }

      // Set the image paths
      setImagePaths(ctrl.supplier, 'logo', ctrl.supplier.logo);
      setImagePaths(ctrl.supplier, 'banner', ctrl.supplier.banner);
      setImagePaths(ctrl.supplier, 'directory_photo', ctrl.supplier.directory_photo);


    });


  }//- loadSupplier()




  /*
   *  Load the list of products that match a filter.
   */
  function loadProductsForSupplier(supplierId) {
    console.log('loadProductsForSupplier(' + supplierId + ')');

    // Load the product records for this supplier.
    var params = {
      //withReferences: false,
      where: {
        supplier_id: supplierId
      }
    }
    TooltwistViews.select(ctrl.teaContext, PRODUCT_VIEW, params, function selected(err, data, metadata) {
      if (err) {
        console.log('Error selecting view ' + PRODUCT_VIEW, err);
        return;
      }
      PRODUCT_METADATA = metadata;
      console.log('PRODUCT_METADATA=', metadata);
      console.log('data=', data);
      console.log('metadata=', metadata);

      // Sort the products by name
      ctrl.products = data;
      ctrl.products.sort(function(p1, p2) {
        var name1 = p1.name.toUpperCase();
        var name2 = p2.name.toUpperCase();
        if (name1 < name2) return -1;
        if (name1 > name2) return +1;
        return 0;
      })

    });
    return;
  }//- loadProductsForSupplier()


  ctrl.doNewProduct = function() {
    console.log('doNewProduct()')
    // console.log('options: ', options);

    var product = {
      // Missing product_id causes it to be inserted.
      supplier_id: ctrl.supplier.id,
      name: ctrl.newProductName,
      is_displayed: 0,
      is_deleted: 0
    };
    console.log('params=', product);

    TooltwistViews.save(ctrl.teaContext, PRODUCT_METADATA, 'new', product, function(err, reply) {
      console.log('save returned', err, reply);
      if (err) {
        console.log('Error selecting view ' + PRODUCT_VIEW + '/new', err);
        return;
      }

      console.log('reply is', reply);
      var productId = reply.data.productId;
      ctrl.newProductName = '';
      //console.log('new product added ' + productId);

      $('#pastac-edit-supplier-add-product-modal').modal('hide')

      // Reload products and tell the user
      $timeout(function() {
        // Reload the product list
        loadProductsForSupplier(ctrl.supplier.id);

        // Call the user handler
        if (ctrl.handler && ctrl.handler.onNewProduct) {
          ctrl.handler.onNewProduct(productId);
        }
      });
    });
  }


  /*
   *  When the user selects a product, call the user handler function.
   */
  ctrl.doSelectProduct = function(product) {
    console.log('doSelectProduct()', product);
    console.log('doSelectProduct()', product.product_id);
    if (!ctrl.handler) {
      console.log('Not calling handler.onSelectProduct (no handler)');
    } else if (!ctrl.handler.onSelectProduct) {
      console.log('Not calling handler.onSelectProduct (no handler.onSelectProduct)');
    } else {
      ctrl.handler.onSelectProduct(product);
    }
  }


  /*
   *                IMAGE LOADING
   */
  ctrl.doUploadImage = function(supplier, prefix) {
     console.log('doUploadImage(prefix:' + prefix + ')');

    // console.log('doUploadImage. supplier=', supplier);
    // See https://github.com/danialfarid/ng-file-upload
    var url = '//' + TEASERVICE_HOST + ':' + TEASERVICE_PORT + '/v3/' + TEASERVICE_APIKEY + '/supplierImage';
    var data = {
      image_type: prefix,
      supplier_id: supplier.id
    };
    console.log('URL=' + url);
    console.log('data is ', data);
    console.log('file is ', file);


    // See if we have a photo or video to load.
    //  var activeTabId = $(".composer .tab-pane.active").attr('id');
    var file = ctrl[prefix+'File'];
    if (file) {
      // if (file && activeTabId === 'composer-tab-photo-video') {

      // Have an image being loaded
      ctrl[prefix+'Filesize'] = accounting.formatNumber(file.size);
      ctrl[prefix+'Filename'] = file.name;
      data.file = file;
      Upload.upload({
        url: url,
        headers: {
          "access-token": "0613952f81da9b3d0c9e4e5fab123437",
          "version": "2.0.0"
        },
        data: data
      }).then(function (resp) {
        console.log('resp: ', resp);
        // console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);

        // alert('Upload has returned')
        var publicId = resp.data.publicId;
        console.log('Upload completed to: ' + publicId);
        $timeout(function() {
          console.log('Uploading details.');

          // Update our supplier record here, so the screen updates
          switch (prefix) {
            case 'logo':
              supplier.logo = 'cloudinary:' + publicId;
              setImagePaths(supplier, 'logo', supplier.logo)
              ctrl.logoFile = null;

              if (ctrl.handler && ctrl.handler.onLogoUpdate) {
                ctrl.handler.onLogoUpdate(supplier);
              }
              break;

            case 'banner':
              supplier.banner = 'cloudinary:' + publicId;
              setImagePaths(supplier, 'banner', supplier.banner)
              ctrl.bannerFile = null;

              if (ctrl.handler && ctrl.handler.onBannerUpdate) {
                ctrl.handler.onBannerUpdate(supplier);
              }
              break;

            case 'directory_photo':
              supplier.directory_photo = 'cloudinary:' + publicId;
              setImagePaths(supplier, 'directory_photo', supplier.directory_photo)
              ctrl.directory_photoFile = null;

              if (ctrl.handler && ctrl.handler.onDirectoryPhotoUpdate) {
                ctrl.handler.onDirectoryPhotoUpdate(supplier);
              }
              break;

            default:
              // Should not be possible
              alert('Unknown image updated. prefix=' + prefix + '.')
          }

        }, 10);

      }, function (resp) {

        // Error
        console.log('Error status: ' + resp.status);
        ctrl[prefix+'file'] = null;
        ctrl[prefix+'Percentage'] = null;
        alert('Sorry, the upload failed.');

      }, function (evt) {
        // Progress
        console.log('evt=', evt);
        // Show the image loading progress
        var perc = parseInt(100.0 * evt.loaded / evt.total);
        console.log('progress: ' + perc + '% ' + evt.config.data.file.name);
        $timeout(function(){
          ctrl[prefix+'Percentage'] = perc;
        }, 1);
      });
    }
  };//- ctrl.doUploadImage()


  ctrl.cancelPost = function(prefix) {
    ctrl[prefix+'file'] = null;
    ctrl[prefix+'Percentage'] = null;
  }

  // ctrl.haveFile = function(prefix) {
  //   //console.log('file is ', ctrl.file);
  //   if (ctrl[prefix+'File']) return true;
  //   return false;
  // }

  // ctrl.showDropArea = function(prefix) {
  //   if (ctrl[prefix+'File']) {
  //     return false;
  //   }
  //   return true;
  // }

  // ctrl.showImage = function(prefix) {
  //   if (ctrl[prefix+'File']) {
  //     return true;
  //   }
  //   return false;
  // }

  ctrl.showProgressBar = function(prefix) {
    return (
      ctrl[prefix+'File']
      && ctrl[prefix+'Percentage']
      && ctrl[prefix+'Percentage'] < 100
    );
  }

  ctrl.showProcessing = function(prefix) {
    // if (prefix == 'banner') {
    //   console.log('showProcessing(' + prefix + ') 1: ', ctrl[prefix+'File'], ctrl[prefix+'Percentage']);
    //   console.log('showProcessing(' + prefix + ') 2: ', ctrl['bannerFile'], ctrl['bannerPercentage']);
    //   console.log('showProcessing(' + prefix + ') 3: ', ctrl.bannerFile, ctrl.bannerPercentage);
    // }
    return (
      ctrl[prefix+'File']
      && ctrl[prefix+'Percentage']
      && ctrl[prefix+'Percentage'] == 100
    );
  }

  // ctrl.getPercentage = function(prefix) {
  //   return ctrl[prefix+'Percentage'];
  // }

  //ZZZZ IS THIS USED?
  ctrl.doToggleIsDisplayed = function(variant, image) {
    // if (image.is_displayed == 1) {
    //   image.is_displayed = 0;
    // } else {
    //   image.is_displayed = 1;
    // }
    // saveProductImageOrderAndIsDisplayed(variant);
  }

  function setImagePaths(record, prefix, image) {
    console.log('setImagePaths(prefix:' + prefix + ', image:' + image + ')');

    const CLOUDINARY_PREFIX = 'cloudinary:';

    var thumbnailVar = '_' + prefix + '_thumbnail';
    var rawVar = '_' + prefix + '_raw';
    var bannerVar = '_' + prefix + '_banner';

    if (!image) {

      // No image
      record[thumbnailVar] = '/assets/images/cleardot.png';
      record[bannerVar] = '/assets/images/cleardot.png';
      record[rawVar] = '/assets/images/cleardot.png';
    } else if (image.startsWith(CLOUDINARY_PREFIX)) {

      // This is a Cloudinary image.
      console.log('IS CLOUDINARY IMAGE');
      // Convert the image to multiple formats
      if (cl == null) {
          // alert('init cl')
          cl = cloudinary.Cloudinary.new( { cloud_name: CLOUDINARY_CLOUD_NAME});
      }

      // See http://cloudinary.com/documentation/image_transformations#resizing_and_cropping_images
      var publicId = image.substring(CLOUDINARY_PREFIX.length);
      var imageName = publicId + '.jpg';
      // image._logo_raw = cl.url(imageName);
      // image._cloudinaryImage_lowquality = cl.url(imageName, { width:200, effect:"blur:600", opacity:50, crop: "scale" });
      //
      // // console.log('----> ' + image._cloudinaryImage_lowquality);
      // //console.log('====> ' + cl.imageTab(imageName, { width:100, blur:300, opacity:50 }));
      // image._cloudinaryImage_320 = cl.url(imageName, { width: 320, crop: "limit"});
      // image._cloudinaryImage_480 = cl.url(imageName, { width: 480, crop: "limit"});
      // image._cloudinaryImage_768 = cl.url(imageName, { width: 768, crop: "limit"});
      // image._cloudinaryImage_992 = cl.url(imageName, { width: 992, crop: "limit"});
      // image._cloudinaryImage_1200 = cl.url(imageName, { width: 1200, crop: "limit"});
      // image._cloudinaryImage_1920 = cl.url(imageName, { width: 1920, crop: "limit"});
      // image._512x512 = cl.url(imageName, { width:512, height: 512, crop: "fit" });
      record[thumbnailVar] = cl.url(imageName, { width:512, height: 512, crop: "fit" });
      record[bannerVar] = cl.url(imageName, { width:1920, height: 250, crop: "fit" });
      record[rawVar] = cl.url(imageName);

      console.log('Setting ' + thumbnailVar + ' to ' + record[thumbnailVar]);

      // var kb = image.image_size / 1024;
      // image._size = accounting.formatNumber(kb) + ' kb';
      // console.log('----> ' + image._thumbnail);

    } else {

      // Not a cloudinary image.
      record[thumbnailVar] = image;
      record[bannerVar] = image;
      record[rawVar] = image;
    }
  }//- setImagePaths()

}
