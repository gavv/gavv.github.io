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

function setupGA(id) {
    var originReferrer = getOriginReferrer();
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    if (originReferrer) {
        gtag('set', 'page_referrer', originReferrer);
    }
    gtag('config', id);
}

function dntEnabed() {
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return dnt == "1" || dnt == "yes";
}

if (!dntEnabed()) {
    document.write(' \
<script async src="https://www.googletagmanager.com/gtag/js?id=G-PM79D0X342"> \
</script> \
<script> \
    setupGA("G-PM79D0X342"); \
</script>')
}
