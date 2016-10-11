# Assisted Prison Visits Scheme (APVS) - External Web

[![Build Status](https://travis-ci.org/ministryofjustice/apvs-external-web.svg?branch=develop)](https://travis-ci.org/ministryofjustice/apvs-external-web?branch=develop) [![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Beta implementation of the Assisted Prison Visits Scheme external web application.

## Requirements

* Node 6 (Including NPM) - If running locally
* (optional) Docker (Including Docker Compose)

## Run

### Locally

Install dependencies and run on port 3000.

```
npm install
./build.sh
npm start
```

### With Docker Compose

This will run the External Web application in container with local files mapped by volume using nodemon and caching modules.
```
./build.sh
docker-compose up
# force image rebuild
# docker-compose up --build
```

## Test

Checks code against standard JS and runs mocha unit tests.
```
npm test
```

Run e2e local selenium test
```
# Requires application running on http://localhost:3000
./node_modules/.bin/gulp e2e
```

## Notes

### Localisation

As a GOV.UK service this application should support Welsh.

Localisation is provided via the [i18n node module](https://www.npmjs.com/package/i18n) which populates localisation strings for the supported locales into `app/locales`. Near the end of the Beta the localisation files will be sent for translation and populated.