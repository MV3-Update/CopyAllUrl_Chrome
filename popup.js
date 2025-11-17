// Get reference to background script (service worker in Manifest V3)
let bkg;
chrome.runtime.getBackgroundPage().then((backgroundPage) => {
	bkg = backgroundPage;
}).catch(() => {
	// Fallback for service worker - we'll need to use chrome.runtime.sendMessage instead
	console.log('Background page not accessible, using message passing');
});

// Affichage du nombre d'URL copiées, message envoyé par la background page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	if (typeof request.type != 'string') return;
	switch(request.type){
		case "copy":
			var nombre = (request.copied_url > 1) ? 's' : '';
			jQuery('#message').removeClass('error').html("<b>"+request.copied_url+"</b> url"+nombre+" successfully copied !");
			setTimeout(function(){window.close();}, 3000); // Fermeture de la popup quelques secondes après affichage du message
			break;
		case "paste":
			// Si un message d'erreur est présent, on l'affiche, sinon on ferme la popup
			if (request.errorMsg) {
				jQuery('#message').addClass('error').html(request.errorMsg);
				return;
			}
			window.close();
			break;
	}
});

// Chargement google analytics
var _gaq = _gaq || [];
chrome.runtime.getBackgroundPage().then((backgroundPage) => {
	if (backgroundPage && backgroundPage.AnalyticsHelper) {
		_gaq.push(['_setAccount', backgroundPage.AnalyticsHelper.gaAccount]);
		_gaq.push(['_trackPageview']);
		backgroundPage.AnalyticsHelper.gaLoad(document);
	}
}).catch(() => {
	console.log('Could not access background page for analytics');
});

/**
* Gestion des boutons de la popup
*/
jQuery(function($){
	$('#actionCopy').on('click', function(e, fromDefaultAction){
		var gaEvent = {
			action: 'Copy',
			label: (fromDefaultAction === true) ? 'BrowserAction' : 'Popup',
			actionMeta: bkg ? bkg.AnalyticsHelper.getActionMeta("copy") : 'mv3-fallback'
		};
		
		// On récupére la fenêtre courante
		chrome.windows.getCurrent(function(win){
			if (bkg && bkg.Action) {
				bkg.Action.copy({window: win, gaEvent: gaEvent});
			} else {
				// Fallback: send message to service worker
				chrome.runtime.sendMessage({
					action: 'copy',
					window: win,
					gaEvent: gaEvent
				});
			}
		});
	});
	$('#actionPaste').on('click', function(e, fromDefaultAction){
		var gaEvent = {
			action: 'Paste',
			label: (fromDefaultAction === true) ? 'BrowserAction' : 'Popup',
			actionMeta: bkg ? bkg.AnalyticsHelper.getActionMeta("paste") : 'mv3-fallback'
		};
		
		if (bkg && bkg.Action) {
			bkg.Action.paste({gaEvent: gaEvent});
		} else {
			// Fallback: send message to service worker
			chrome.runtime.sendMessage({
				action: 'paste',
				gaEvent: gaEvent
			});
		}
	});
	$('#actionOption').click(function(e){
		if (typeof _gaq !== 'undefined') {
			_gaq.push(['_trackEvent', 'Internal link', 'Option', 'options.html']);
		}
		chrome.tabs.create({url: 'options.html'});
	});
	$('#contribute a').click(function(e){
		if (typeof _gaq !== 'undefined') {
			_gaq.push(['_trackEvent', 'Internal link', 'Contribute', 'options.html#donate']);
		}
		chrome.tabs.create({url: 'options.html#donate'});
	});
	
	// Default action
	chrome.storage.local.get({
		'default_action': 'menu'
	}).then((settings) => {
		var default_action = settings.default_action;
		if( default_action != "menu" ){
			// Masquage des boutons
			$('body>ul').hide();
			$('#message').css({'padding':'3px 0 5px'});
			
			// Déclenchement de l'action par défaut configurée dans les options
			switch(default_action){
				case "copy":
					$('#actionCopy').trigger('click', [true]);
					break;
				case "paste":
					$('#actionPaste').trigger('click', [true]);
					break;
			}
		}
	});
	
	// Affichage notification nouvelle version dans la page d'option
	if (bkg && bkg.UpdateManager && bkg.UpdateManager.recentUpdate()) {
		var content = "New version recently installed. Check the <a href=\"http://finalclap.github.io/CopyAllUrl_Chrome/\">changelog</a>.";
		$('#recently-updated').html(content).show().find('a').click(function(e){
			if (typeof _gaq !== 'undefined') {
				_gaq.push(['_trackEvent', 'External link', 'changelog recent update', $(this).attr('href')]);
			}
			chrome.tabs.create({url: $(this).attr('href')});
		});
	}
});