# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.


Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

npx create-react-app my-project
cd my-project

npm install -D tailwindcss
npx tailwindcss init

Configure your template paths
Add the paths to all of your template files in your tailwind.config.js file

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

Add the Tailwind directives to your CSS
Add the @tailwind directives for each of Tailwind’s layers to your ./src/index.css file.

@tailwind base;
@tailwind components;
@tailwind utilities;

### cài thu viện
npm install @headlessui/react
### Thư viên icon
npm install @heroicons/react
### Thư viện để REST API
npm install axios

### Cấu trúc dự án
Web_app_Towa/
├── backend/
│   ├── src/
│   │   ├── controllers/             # Nơi chứa các logic xử lý cho từng module
│   │   │   ├── users/               # Controller của user
│   │   │   │   └── userController.js
│   │   │   └── avatars/             # Controller xử lý avatar
│   │   │       └── avatarController.js
│   │   ├── middleware/              # Middleware dùng chung
│   │   │   └── Users/
│   │   │       └── uploadAvatar.js  # Middleware upload file
│   │   ├── models/                  # Định nghĩa các model cho database
│   │   │   ├── Users.js
│   │   │   ├── Departments.js
│   │   │   └── Roles.js
│   │   ├── routes/                  # Định nghĩa các route API
│   │   │   ├── userRoutes.js        # Route cho user
│   │   │   ├── avatarRoutes.js      # Route cho avatar
│   │   │   └── index.js             # Đăng ký toàn bộ route
│   │   ├── uploads/                 # Nơi lưu file tĩnh upload từ client
│   │   │   └── avatars/             # Thư mục avatar
│   │   ├── server.js                # File khởi chạy server
│   │   └── ...
│   ├── package.json
│   └── ...
└── frontend/
    ├── public/                      # Các file tĩnh cho frontend
    ├── src/
    │   ├── components/              # Component ReactJS
    │   │   ├── User/                # Component liên quan đến user
    │   │   │   └── AvatarUpload.js  # Component upload avatar
    │   │   └── ...                  
    │   ├── App.js                   # Entry point chính của ReactJS
    │   ├── index.js
    │   └── ...
    ├── package.json
    └── ...
