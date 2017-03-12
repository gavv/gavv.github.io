function getOriginReferrer() {
    var cookies = "; " + document.cookie;
    var cookieParts = cookies.split("; originreferrer=");
    if (cookieParts.length == 2) {
        var originReferrer = cookieParts.pop().split(";").shift();
        if (originReferrer && originReferrer != "") {
            return decodeURIComponent(originReferrer);
        }
    }
}

function setupGA() {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-93472390-1', 'auto');
    var originReferrer = getOriginReferrer();
    if (originReferrer) {
        ga('set', 'referrer', originReferrer);
    }
    ga('send', 'pageview');
}

function dntEnabed() {
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return dnt == "1" || dnt == "yes";
}

if (!dntEnabed()) {
    setupGA();
}
