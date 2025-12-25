# WikiCards

A little web app where you can collect Wikipedia articles as trading cards.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building and Deploying

To build the project run:

```bash
ng build --configuration production --base-href="/wiki-cards/" --deploy-url="/wiki-cards/"

npx angular-cli-ghpages --dir=dist/wiki-cards/browser --no-silent
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
