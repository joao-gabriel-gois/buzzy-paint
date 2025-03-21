# Buzzy Paint
This version has new features comparing to the one [submitted to CS50](https://github.com/joao-gabriel-gois/CS50_Introduction-To-Computer-Science/tree/main/final_project). 

#### CS50 Video Demo (Old version): [Buzzy Paint Presentation](https://drive.google.com/file/d/1ba5drfJ3k4e_WTPmjibkn4eEaQTp0UXj/view?usp=sharing)

<sup style="font-size: 8pt; margin-top: -40px"><i>Old version, that was fast-forwarded in the [submitted repository](https://github.com/joao-gabriel-gois/CS50_Introduction-To-Computer-Science/tree/main/final_project) to become a 3 minute video as required</i></sup>

#### New features since that:
1. Export current draw as JSON
2. Import draw JSON file as a new Tab
3. Export image (as jpg or transparent png)
4. Polygon and Rectangle/Square Drawing Tools
5. Custom Alerts, Prompt and Confirm Dialogs
5. Background Blur / Fadeout Animation for Alerts, Prompts and Confirm Dialogs
6. Fixes in client-side API refresh-session call

The upcoming updates are detailed in the [**<u>"Next Steps" section</u>**](#next-steps) at the end of this document
___

### Description:

This is a simple Paint application, with less features, but totally web based. You can create an user, login, and save your drawings into your account. It persists the user data using Postgres SQL and reference it to the client-side state, once saved, persisting the data for each tab, the last one active and each drawing for each CanvasListener instance (aka Tab) in MongoDB. Once it is saved for the first time, it is associated with a Postgres column called `draws_mongo_id`, that is initialized as `null`. Now, with this first version, it is easier to extend new drawing features (like different shapes) once Mongo is schema-free and would accept new state details to be added later. 

**CS 50 Submitted version - main features**:
 - Create Account and Login (authentication with JWT, with http-only refresh token - that expires only after 40 days)
 - Validation on both frontend and backend
 - Once logged in, you can draw with the cursor (pencil), draw straight lines, add text, zoom it in/out and erase.
 - You can add new tabs and rename them by double clicking on its current name.
 - Once you're done, you can save it by typing `ctrl + s` or clicking in the `save` option in the header.
    - It will persist the tabs names, the latest active tab, a timestamp to always load the latest version even if users save it offline so, if they're using the same device and broswer, they will not lose data and can keep drawing from the same point as before and try to save it again once back online.

**Navigation/Behaviours:**

If a user is starting a session for a first time, the `draws_mongo_id` column for him/her would be null. The frontend side script (`api.js`) can handle different cases for the first saving (calling a `POST` to api's `/draws` route). After that, it would only update the same MongoDB document and persist new user's tabsData state (calling a `PUT` to api's `/draws` route). There is a router on client side (`client/src/shared/router.js`) that would handle the proper redirects for each case. So if you go to `127.0.0.1:8080` and you don't have a saved token in your `localStorage`, it will redirect you to login screen. Once logged in, the same `/` path will now check for your drawings based on your token, refresh it if it is expired (with httpOnly calls, for security reasons) and then finally redirect you to `/home`, which will draw your latest state once loaded. The `/` path is where the user is redirected after the login: it displays a loading screen while fetch the drawings data for that user, if any. In cases where the users are offline and try to save their state, they will not be able to reach the Deno API, but the localStorage will persist it with a timestamp. If user gets online again and the backend side state is outdated, in a next login, the state fetched in `/` will not be loaded, so user can persist the latest offline state, draw a little bit more, and finally save it in the api later. The client-side styles are not responsive in this version. 

___

### Technologies Used:

**client-side**: Vanilla JS without no dependencies. Everything was created from scratch.

**server-side**: Deno Application with following packages: 
  - `express`, `cors` and `cookie-parser` to handle server features
  - No ORM, only the main drivers for the databases, that is: `mongodb` and `pg` npm packages.
  - And finally, for validation on backend-side: `zod`.
  - The backend application also uses `typescript`, but this is already supported directly by Deno, no need to be added in the `devDependencies` once this project doesn't have any `package.json`.

The idea was to avoid as much as possible external packages to face the challenge to handle everything directly. As I've never used Deno before, I choosed it to validate the development experience and I actually liked it a lot. But for productivity/deadline reasons, the `express` package has been choosen in this case, so the experience wasn't that different from node application, except for the fact that is way more easier to handle configuration details, default module import paths and also `typescript`, among other things (we don't have hundreds of config files, only `deno.json`).

___

### Hot to run

1. Copy the `.env.example` file in the same directory as `.env`
2. Change the details with the credentials you want to use in your case.
3. Now go to the `server/` directory and install deno dependencies by running `deno install --allow-scripts`
3. Open two terminal shells and type the following commands, respectively:

    `Terminal Instance - 1:`
    ```bash
    $ cd server/
    $ docker-compose up
    ```
    `Terminal Instance - 2:`
    ```bash
    $ cd client/
    $ npx http-server ./src
    ```

Now you can go to `127.0.0.1:8080` and interact with the application. Don't use `localhost`! It will fail in the default/local CORS policy for the backend.

___

### ⚠️ Deploy

This version is not ready to deploy yet. So there is some adaptations to do in order to deploy it, specially in the refresh-token https-only config, CORS policy and some other details. This section will be updated once it is ready to be deployed at `https://buzzypaint.buzzybyte.com`

___

### Project Structure:

```

├── LICENSE
├── README.md
├── client
│   └── src
│       ├── assets
│       │   ├── 404.png
│       │   ├── back.svg
│       │   ├── bg.svg
│       │   ├── bg_transparent.svg
│       │   ├── ellipser.svg
│       │   ├── eraser.svg
│       │   ├── error.png
│       │   ├── info.png
│       │   ├── line.svg
│       │   ├── loading.png
│       │   ├── pencil_case.png
│       │   ├── pencil.svg
│       │   ├── polygon.svg
│       │   ├── rectangler.svg
│       │   ├── success.png
│       │   ├── text.svg
│       │   ├── warning.png
│       │   └── zoom-in.svg
│       ├── home
│       │   ├── home.js
│       │   ├── index.html
│       │   ├── modules
│       │   │   ├── CanvasEventListener.js
│       │   │   ├── canvas-tools-handlers
│       │   │   │   ├── DrawerEventHandler.js
│       │   │   │   ├── EllipseEventHandler.js
│       │   │   │   ├── EraserEventHandler.js
│       │   │   │   ├── LinerEventHandler.js
│       │   │   │   ├── parent
│       │   │   │   │   └── ToolEventHandler.js
│       │   │   │   ├── PolygonEventHandler.js
│       │   │   │   ├── RectangleEventHandler.js
│       │   │   │   ├── WritterEventHandler.js
│       │   │   │   └── ZoomerEventHandler.js
│       │   │   ├── TabsManager.js
│       │   │   └── ToolbarClickListener.js
│       │   └── style.css
│       ├── index.html
│       ├── index.js
│       ├── login
│       │   ├── index.html
│       │   ├── login.js
│       │   └── style.css
│       ├── not-found
│       │   └── index.html
│       ├── shared
│       │   ├── alerts.css
│       │   ├── alerts.js
│       │   ├── api.js
│       │   ├── global.js
│       │   ├── router.js
│       │   ├── validator.css
│       │   └── validator.js
│       ├── signup
│       │   ├── index.html
│       │   ├── signup.js
│       │   └── style.css
│       └── utils
│           ├── addJSONImportEvent.js
│           ├── cssUtils.js
│           ├── encodingUtils.js
│           ├── fromRGBtoHex.js
│           ├── getRelativeCursorPos.js
│           ├── handleImageDownload.js
│           └── smoothlyFadeoutElement.js
└── server
    ├── deno.json
    ├── deno.lock
    ├── docker-compose.yml
    ├── Dockerfile
    ├── entrypoint.sh
    └── src
        ├── config
        │   └── auth.ts
        ├── modules
        │   ├── accounts
        │   │   ├── DTOs
        │   │   │   ├── CreateUserDTO.ts
        │   │   │   ├── CreateUserTokensDTO.ts
        │   │   │   └── UpdateUserDTO.ts
        │   │   ├── models
        │   │   │   ├── UserTokens.ts
        │   │   │   └── User.ts
        │   │   ├── repositories
        │   │   │   ├── in-memory
        │   │   │   │   ├── usersRepository.ts
        │   │   │   │   └── usersTokensRepository.ts
        │   │   │   ├── IUsersRepository.ts
        │   │   │   ├── IUsersTokensRepository.ts
        │   │   │   └── postgres
        │   │   │       ├── usersRepository.ts
        │   │   │       └── usersTokensRepository.ts
        │   │   └── useCases
        │   │       ├── AuthenticateUser
        │   │       │   ├── authenticateUserController.ts
        │   │       │   ├── authenticateUserService.ts
        │   │       │   └── tests
        │   │       │       └── authenticateUserService_test.ts
        │   │       ├── CreateUser
        │   │       │   ├── createUserController.ts
        │   │       │   ├── createUserService.ts
        │   │       │   └── tests
        │   │       │       └── createUserService_test.ts
        │   │       ├── RefreshUserToken
        │   │       │   ├── refreshUserTokenController.ts
        │   │       │   ├── refreshUserTokenService.ts
        │   │       │   └── tests
        │   │       │       └── refreshTokenService_test.ts
        │   │       └── UpdateUser
        │   │           ├── tests
        │   │           │   └── updateUserService_test.ts
        │   │           ├── updateUserController.ts
        │   │           └── updateUserService.ts
        │   └── draws
        │       ├── DTOs
        │       │   ├── DrawsDTO.ts
        │       │   └── isDrawsDTO.ts
        │       ├── repositories
        │       │   ├── IDrawsRepository.ts
        │       │   ├── in-memory
        │       │   │   └── drawsRepository.ts
        │       │   └── mongo
        │       │       └── drawsRepository.ts
        │       ├── types.d.ts
        │       └── useCases
        │           ├── CreateDraws
        │           │   ├── createDrawsController.ts
        │           │   ├── createDrawsService.ts
        │           │   └── tests
        │           │       └── createDrawsService_test.ts
        │           ├── GetDraws
        │           │   ├── getDrawsController.ts
        │           │   ├── getDrawsService.ts
        │           │   └── tests
        │           │       └── getDrawsService_test.ts
        │           ├── tabsDTOTestSample.ts
        │           └── UpdateDraws
        │               ├── tests
        │               │   └── updateDrawsService_test.ts
        │               ├── updateDrawsController.ts
        │               └── updateDrawsService.ts
        ├── shared
        │   ├── errors
        │   │   └── ApplicationError.ts
        │   └── infra
        │       ├── http
        │       │   ├── app.ts
        │       │   ├── middlewares
        │       │   │   ├── ensureAuthentication.ts
        │       │   │   ├── errorHandler.ts
        │       │   │   └── sillyLogger.ts
        │       │   ├── routes
        │       │   │   ├── authenticationRoutes.ts
        │       │   │   ├── drawsRoutes.ts
        │       │   │   ├── index.ts
        │       │   │   └── userRoutes.ts
        │       │   └── server.ts
        │       ├── mongo
        │       │   ├── config.ts
        │       │   └── initdb
        │       │       └── initMongo.js
        │       └── postgres
        │           ├── config.ts
        │           ├── initdb
        │           │   └── init.sql
        │           ├── migrate.ts
        │           └── migrations
        │               ├── 001_create_users_table.sql
        │               ├── 002_create_user_tokens_table.sql
        │               └── 003_alter_users_table_adding_draws_id.sql
        ├── @types
        │   └── global.d.ts
        └── utils
            ├── expiryDateMapper.ts
            ├── hash.ts
            └── sleep.ts

57 directories, 125 files
```
___

### Next Steps

**Server**:

(1st milestone)
- [x] <s>Add UpdateDraw Usecase Typying and Create Validation for them</s>
- [x] <s>Add unit tests after changes</s>
- [ ] <b>Implement CI/CD</b>

(2nd milestone)
- [ ] Prepare first deploy after finishing both backend and frontend 1st milestones
- [ ] Password Recovery provider (for both dev/test and prod envs)
- [ ] Token management (review invalid tokens deletion after refreshing and frequent cleanup of the ones with expired refresh-token)
- [ ] OAuth (google/facebook/github)
- [ ] Set proper routes, controllers and services for future User config screen
- [ ] Totally remove MongoDB and change to Postgres JSONB
  - [ ] Keep a separated Draws Entity to be able to create shared drawing workspace (websockets) for more than one user in future (one or many users for zero or many drawings) 

**Client**

(1st milestone)
- [x] <s>Ellipse drawing tool (becoming circle when keeping ctrl pressed, just like Rectangle/Square current feature)</s>
- [ ] <b>Crop/Move selected areas</b>
- [ ] Figure Out how to apply fill with collision / closed shapes detection (just like MS Classic Win98 Paint App)

(2nd milestone)
- [ ] Recover Password Screen
- [ ] User config screen (update details), consuming from backend apis

___

**Intent after both backend and frontend milestones completion**: From user session, create user connection for shared workspaces with realtime drawing (websockets)