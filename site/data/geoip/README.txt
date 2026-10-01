Offline location data for the website analytics (no npm package needed).
Source: DB-IP.com "IP to City Lite", "IP to Country Lite" and "IP to ASN Lite" - CC BY 4.0 - IP Geolocation by DB-IP (https://db-ip.com)
  city.bin                        country + state/region + city      (used first)
  country-v4.bin, country-v6.bin  country only                       (fallback if city.bin is missing)
  asn.bin                         mobile-carrier and VPN / data-centre address ranges (small; optional)
                                  Visits from these networks keep only the country: their state/city would be the carrier's hub.
Rebuild/update monthly (needs internet, takes about 2 minutes):  npm run geoip:update
Then restart the site so it loads the new files. The whole data/geoip folder must be deployed with the site.
