/**
 * Main class for WebCMS2 system.
 * @author Tomas Voslar
 * @returns 
 */
function Webcms() {
	
	this.defaultConfirm = 'Confirm action?';
	this.externals = new Array();
	this.filesystem = null;
	this.tour = null;
	this.translator = null;
	this.basePath = null;
	this.initiated = false;
	
	this.init();
}

Webcms.prototype = {
	self: null,
	init: function() {
		self = this;

		self.translator = new WebcmsTranslator(self);
		self.filesystem = new WebcmsFilesystem(self);
		self.tour = new WebcmsTour(self);
		self.basePath = $('base').attr('href');

		self.registerDatePickers();
		
		/**
		 * Nette ajax Grido extension.
		 * @author Petr BugyĂ­k
		 * @param {jQuery} $
		 */
		"use strict";
		$.nette.ext('grido',
			{
				load: function()
				{
					this.selector = $('.grido');
					this.selector.grido();
				},
				success: function(payload)
				{
					this.selector.trigger('success.ajax.grido', payload);

					for (snippet in payload.snippets) {
						if (payload.snippets[snippet].indexOf('alert-success') !== -1) {
							$('#myModal').modal('hide');
						}
					}

					self.registerDatePickers();

					$(document).off('change', '.daterange');
					$(document).on('change', '.daterange', function(){
						var splitted = $(this).val().split('-');
						if (splitted.length > 2) {
							$(this).val(splitted[0] + '-' + splitted[2]);
						}
					});

					//scroll up after ajax update
					$('html, body').animate({scrollTop: 0}, 400);
				}
			}, {
			selector: null
		});

		var longRun = false;
		$(document).on('click', ".ajax", function() {
			if ($(this).hasClass('longRun')) {
				longRun = true;
			} else {
				longRun = false;
			}
		});

		$.nette.init(function(ajaxHandler) {
			if (!self.initiated) {
				$(document).on('click', 'a.ajax:not(.no-ajax)', ajaxHandler);
				$(document).on('click', 'form.ajax :submit', ajaxHandler);
				self.initiated = true;
			}
		});

		// links context menu
		$(document).on('contextmenu', 'a', function(e) {
			e.preventDefault();

			$('.context-menu').remove();
			if (!$(this).hasClass('favourite')) {
				$(this).append('<div style="position: absolute;" class="nav navbar context-menu"><a class="btn btn-default ajax" href="'+basePath+'/admin?do=addToFavourite&link=' + $(this).attr('href') + '&title=' + $(this).html() + '">Add to favourite</a></div>')
			} else {
				$(this).append('<div style="position: absolute;" class="nav navbar context-menu"><a class="btn btn-default ajax" href="'+basePath+'/admin?do=removeFromFavourite&idFav=' + $(this).data('id') + '">Remove</a></div>')
			}
		});

		$(document).on('click', function() {
			$('.context-menu').remove();
		});

		//ajax loader animation
		$(document).ajaxStart(function() {
			if (longRun) {
				$('.spinner-wrapper').show();
			} else {
				$('#loader').addClass("active");
			}
		}).ajaxStop(function() {
			self.afterReload();
			
			if(!self.tour.bootTour.ended()){
				self.tour.bootTour.init();
				self.tour.bootTour.start();
			}
			
			$('.context-menu').remove();
			$('#loader').removeClass("active");
			$('.spinner-wrapper').hide();
		});		
		

		self.afterReload();
		self.__registerListeners();

	},
	afterReload: function() {

		$(".datepicker:not(.k-input)").kendoDatePicker({
			format: 'dd.MM.yyyy'
		});

		self.initTextEditors();
	},
	registerDatePickers: function() {
		$('.date').datepicker({
			format: "m.d.yyyy",
			autoclose: true,
			language: "cs"
		});

		$('.daterange').datepicker({
			format: "m.d.yyyy",
			multidate: true,
			multidateSeparator: "-",
			autoclose: true,
			language: "cs"
		});
	},
	registerExternal: function(ext) {
		this.externals.push(ext);
	},
	onStart: function() {
		// init wysiwyg editor
		self.initTextEditors();

		// load external functions
		for (var i = 0; i < this.externals.length; i++) {
			eval(this.externals[i]);
		}
	},
	/* Global systems listeners registering. */
	__registerListeners: function() {
		// register bootbox confirm window for all danger buttons
		$(document).on("click", ".btn-danger", function(e) {
			e.preventDefault();
			var anchor = this;
			var title = $(this).data("confirm");

			if (typeof title === "undefined")
				title = self.defaultConfirm;

			bootbox.confirm(title, function(confirmed) {
				if (confirmed)
					window.location.href = anchor.href;
			});
		});

		$(document).on('click', ".jq_head a.ajax", function() {
			$(".jq_head a.ajax").parent().removeClass('active');

			$(this).parent().addClass('active');
		});

		$(document).on('change', "#languageChanger", function() {
			$(this).parent().submit();
		});
		
		$(document).on('mouseover', ".navbar-brand",function(){
			$(".sidebar .well").show('fast', 'swing');
		});
		
		$(".content").mouseover(function(){
			
			if($(".sidebar .well").css('display') === 'block'){
				setTimeout("self.hideSidebar()", 500);
			}
		});

		$(document).on('click', "a.subopen", function(event) {
			event.preventDefault();
			$(this).parent().toggleClass('open');
		});

		/*$(document).on('click', ".sub ul a", function(event) {
			$(this).parent().parent().parent().toggleClass('open');
			$(this).parent().parent().parent().addClass('active');
		});

		$(document).on('click', ".navbar ul a", function(event) {
			$('.navbar ul li').removeClass('active');
			$(this).parent().addClass('active');
		});*/
	},
	
	hideSidebar : function(){
		$(".sidebar .well").hide('fast', 'swing');
	},
	initTextEditors: function() {

		$(".editor:not(.k-content)").ckeditor({
			filebrowserBrowseUrl: basePath + '/admin/filesystem?dialog=1&multiple=0',
			filebrowserImageBrowseUrl: basePath + '/admin/filesystem?dialog=1&filter=images&multiple=0',
			allowedContent: true,
			entities: false,
			baseHref : self.basePath,
			contentsCss: self.basePath + 'css/all.php'
		});

	}
};

var webcms;
$(function(){
	webcms = new Webcms();
});
