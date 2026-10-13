/* Invitation activation shares the existing secure password-setting form. */
if (new URLSearchParams(location.search).get('setup')==='1' ||
    /(?:^|[&#])type=invite(?:&|$)/.test(location.hash)) {
  recovering=true;
}
