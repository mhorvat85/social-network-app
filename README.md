# Project

Small social-network application for posting, chating and following other users.

## Technologies

Project is created with:

- JavaScript
- Express
- EJS Embedded JavaScript templating
- Webpack - for client-side bundle

## Setup

To run this project in development environment, download ZIP or clone the project and install it locally using npm.
If you are runnig app on Linux based systems, running it with prewritten script commands should suffice.

```
$ npm install
$ npm run watch
```

Otherwise, Windows platform should include start command:

```
"scripts": {
    "watch": "start nodemon db --ignore frontend-js --ignore public/ && start webpack --watch"
}
```
