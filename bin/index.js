#! /usr/bin/env node
const inquirer = require("inquirer");
const fs = require("fs");
const util = require("util");
const yaml = require("js-yaml");
const printMessage = require("print-message");
const exec = util.promisify(require("child_process").exec);

const ownPath = process.cwd();
const allData = {};
const loader = ["|", "/", "-", "\\"];

function getName() {
  inquirer
    .prompt([
      {
        type: "input",
        message: "What is your project name?",
        name: "name",
        default: "my-project",
      },
    ])
    .then((answer) => {
      allData.name = answer.name;
      getDatabase();
    });
}

function getDatabase() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "Select the wanted database",
        name: "database",
        loop: false,
        default: "mysql",
        choices: [
          {
            name: "None",
            value: "none",
          },
          {
            name: "MySQL",
            value: "mysql",
          },
          {
            name: "PostgreSQL",
            value: "postgresql",
          },
        ],
      },
    ])
    .then((answer) => {
      allData.database = answer.database;
      if (allData.database !== "none") {
        inquirer
          .prompt([
            {
              type: "input",
              message: "What is the name of the database?",
              name: "databaseName",
              default: "my-database",
            },
            {
              type: "input",
              message: "What is the name of the user?",
              name: "databaseUser",
              default: "my-user",
            },
            {
              type: "input",
              message: "What is the password of the user?",
              name: "databasePassword",
              default: "my-password",
            },
            {
              type: "input",
              message: "What is the name of the root password?",
              name: "databaseRootPassword",
              default: "my-root-password",
            },
          ])
          .then((answer) => {
            allData.databaseName = answer.databaseName;
            allData.databaseUser = answer.databaseUser;
            allData.databasePassword = answer.databasePassword;
            allData.databaseRootPassword = answer.databaseRootPassword;
            getApi();
          })
          .catch((err) => {
            throw new Error(err);
          });
      } else {
        getApi();
      }
    });
}

function getApi() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "Select the wanted API",
        name: "api",
        loop: false,
        default: "cocasus",
        choices: [
          {
            name: "None",
            value: "none",
          },
          {
            name: "Cocasus",
            value: "cocasus",
          },
          {
            name: "Express",
            value: "express",
          },
          {
            name: "Flask",
            value: "flask",
          },
        ],
      },
    ])
    .then((answer) => {
      allData.api = answer.api;
      getFrontBack();
    });
}

function getFrontBack() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "Select the wanted Framework",
        name: "frontBack",
        loop: false,
        default: "cocasus",
        choices: [
          {
            name: "None",
            value: "none",
          },
          {
            name: "Cocasus",
            value: "cocasus",
          },
          {
            name: "React",
            value: "react",
          },
          {
            name: "Vue",
            value: "vue",
          },
          {
            name: "Flask",
            value: "flask",
          },
        ],
      },
    ])
    .then((answer) => {
      allData.frontBack = answer.frontBack;
      clearFolder();
    });
}

function clearFolder() {
  // Ask for clearing the folder if it's not empty
  fs.readdir(ownPath, (err, files) => {
    if (err) {
      throw new Error(err);
    }
    if (files.length > 0) {
      inquirer
        .prompt([
          {
            type: "confirm",
            message: "Do you want to clear the folder?",
            name: "clearFolder",
            default: false,
          },
        ])
        .then((answer) => {
          if (answer.clearFolder) {
            fs.readdir(`${ownPath}`, (err, files) => {
              if (err) throw err;
              for (const file of files) {
                // Remove directories recursively `${ownPath}/${file}`
                fs.rmSync(`${ownPath}/${file}`, { recursive: true });
              }
              createProjectsFolders();
            });
          } else {
            createProjectsFolders();
          }
        });
    } else {
      createProjectsFolders();
    }
  });
}

async function createProjectsFolders() {
  // Database
  // For every database create a folder with the name db
  if (allData.database !== "none") {
    const dbFolder = "db";
    fs.mkdirSync(dbFolder);
    if (allData.database === "mysql") {
      // Create the mysql folder
      fs.mkdirSync(`${dbFolder}/data`);
      // make the file Dockerfile
      const content = "FROM mysql:5.7\nEXPOSE 3306";
      fs.writeFileSync(`${dbFolder}/Dockerfile`, content);
    } else if (allData.database === "postgresql") {
      // Create the postgresql folder
      fs.mkdirSync(`${dbFolder}/data`);
      // make the file Dockerfile
      const content = "FROM postgres:9.6\nEXPOSE 5432";
      fs.writeFileSync(`${dbFolder}/Dockerfile`, content);
    }
  }
  // Create the folder for the API
  if (allData.api !== "none") {
    if (allData.api === "express") {
      const packageName = "@rharkor/express-api-boilerplate --no-interaction";
      await installDependency(packageName);
    } else if (allData.api === "flask") {
      const packageName = "@rharkor/flask-api-boilerplate  --no-interaction";
      await installDependency(packageName);
    } else if (allData.api === "cocasus") {
      const packageName =
        "cocasus init --type api --name cocasus-app --root ./cocasus-api --deps false";
      await installDependency(packageName);
      fs.copyFileSync(
        `${ownPath}/cocasus-api/.env.example`,
        `${ownPath}/cocasus-api/.env`
      );
    }
  }

  if (allData.frontBack !== "none") {
    if (allData.frontBack === "flask") {
      const packageName = "@rharkor/flask-web-boilerplate  --no-interaction";
      await installDependency(packageName);
    } else if (allData.frontBack === "react") {
      const packageName = "create-react-app my-react-app";
      await installDependency(packageName);
      // Remove the .git folder
      fs.rmSync(`${ownPath}/my-react-app/.git`, { recursive: true });
      // Create the docker file for the react app
      let content =
        'FROM node:14.16\nWORKDIR /app/web\nCOPY package*.json ./\nRUN npm i\nCOPY . .\nEXPOSE 8080\nCMD ["npm", "start"]';
      fs.writeFileSync(`${ownPath}/my-react-app/Dockerfile`, content);
      // Create the .env.example
      content = "PORT=8080";
      fs.writeFileSync(`${ownPath}/my-react-app/.env.example`, content);
      // Create the .env
      fs.copyFileSync(
        `${ownPath}/my-react-app/.env.example`,
        `${ownPath}/my-react-app/.env`
      );
    } else if (allData.frontBack === "vue") {
      const packageName = "vue create my-vue-app --default";
      await installDependency(packageName, "npm i -g @vue/cli");
      // Remove the .git folder
      fs.rmSync(`${ownPath}/my-vue-app/.git`, { recursive: true });
      // Create the docker file for the react app
      let content =
        'FROM node:14.16\nWORKDIR /app/web\nCOPY package*.json ./\nRUN npm i\nCOPY . .\nEXPOSE 8080\nCMD ["npm", "run", "serve"]';
      fs.writeFileSync(`${ownPath}/my-vue-app/Dockerfile`, content);
      // Create the .env.example
      content = "PORT=8080";
      fs.writeFileSync(`${ownPath}/my-vue-app/.env.example`, content);
      // Create the .env
      fs.copyFileSync(
        `${ownPath}/my-vue-app/.env.example`,
        `${ownPath}/my-vue-app/.env`
      );
    } else if (allData.frontBack === "cocasus") {
      const packageName =
        "cocasus init --type web --name cocasus-web --root ./cocasus-app --deps false";
      await installDependency(packageName);
      fs.copyFileSync(
        `${ownPath}/cocasus-app/.env.example`,
        `${ownPath}/cocasus-app/.env`
      );
    }
  }

  createDockerCompose();
}

async function installDependency(packageName, previous = "") {
  let i = 0;
  const ui = new inquirer.ui.BottomBar({ bottomBar: loader[0] });
  const installInterval = setInterval(() => {
    i++;
    ui.updateBottomBar(
      `Installing ${packageName} ${loader[i % loader.length]}`
    );
  }, 300);
  return new Promise((resolve, reject) => {
    // Initialize the API boilerplate
    exec(`${previous ? previous + " && " : ""}npx -y ${packageName}`)
      .then(() => {
        clearInterval(installInterval);
        ui.updateBottomBar(`Installation of ${packageName} is done\n`);
        ui.close();
        resolve();
      })
      .catch((err) => {
        console.error("The installation has failed", err);
        reject(err);
      });
  });
}

function createDockerCompose() {
  const content = {
    version: "3.7",
    services: {},
    networks: {
      "back-network": {
        driver: "bridge",
      },
    },
  };
  if (allData.frontBack !== "none") {
    if (allData.frontBack === "react") {
      content.services.web = {
        build: {
          context: "my-react-app",
          dockerfile: "Dockerfile",
        },
        image: `${allData.name}-react-web`,
        container_name: `${allData.name}-react-web`,
        ports: ["8080:8080"],
        volumes: ["./my-react-app:/app/web"],
        networks: ["back-network"],
      };
    } else if (allData.frontBack === "flask") {
      content.services.web = {
        build: {
          context: "flask-web",
          dockerfile: "Dockerfile",
        },
        image: `${allData.name}-flask-web`,
        container_name: `${allData.name}-flask-web`,
        ports: ["8080:8080"],
        volumes: ["./flask-web:/app/web"],
        networks: ["back-network"],
      };
    } else if (allData.frontBack === "vue") {
      content.services.web = {
        build: {
          context: "my-vue-app",
          dockerfile: "Dockerfile",
        },
        image: `${allData.name}-vue-web`,
        container_name: `${allData.name}-vue-web`,
        ports: ["8080:8080"],
        volumes: ["./my-vue-app:/app/web"],
        networks: ["back-network"],
      };
    } else if (allData.frontBack === "cocasus") {
      content.services.web = {
        build: {
          context: "cocasus-app",
          dockerfile: "Dockerfile",
        },
        image: `${allData.name}-cocasus-web`,
        container_name: `${allData.name}-cocasus-web`,
        ports: ["8080:8080"],
        networks: ["back-network"],
      };
    }
  }

  if (allData.api !== "none") {
    if (allData.frontBack !== "none") {
      content.services.web.depends_on = ["api"];
    }

    if (allData.api === "express") {
      content.services.api = {
        build: {
          context: "express-api",
          dockerfile: "Dockerfile",
        },
        image: `${allData.name}-express-api`,
        container_name: `${allData.name}-express-api`,
        volumes: ["./express-api:/app/api"],
        ports: ["5000:5000"],
        networks: ["back-network"],
      };
    } else if (allData.api === "flask") {
      content.services.api = {
        build: {
          context: "flask-api",
          dockerfile: "Dockerfile",
        },
        image: `${allData.name}-flask-api`,
        container_name: `${allData.name}-flask-api`,
        volumes: ["./flask-api:/app/api"],
        ports: ["5000:5000"],
        networks: ["back-network"],
      };
    } else if (allData.api === "cocasus") {
      content.services.api = {
        build: {
          context: "cocasus-api",
          dockerfile: "Dockerfile",
        },
        image: `${allData.name}-cocasus-api`,
        container_name: `${allData.name}-cocasus-api`,
        ports: ["5000:5000"],
        networks: ["back-network"],
      };
    }
  }

  if (allData.database !== "none") {
    if (allData.api !== "none") {
      content.services.api.depends_on = ["db"];
    }
    if (allData.frontBack !== "none" && !content.services.api.depends_on) {
      content.services.web.depends_on = ["db"];
    }

    if (allData.database === "mysql") {
      content.services.db = {
        build: {
          context: "db",
          dockerfile: "Dockerfile",
        },
        image: `${allData.name}-db`,
        container_name: `${allData.name}-db`,
        ports: ["3306:3306"],
        volumes: ["./db/data:/var/lib/mysql"],
        environment: {
          MYSQL_ROOT_PASSWORD: allData.databaseRootPassword,
          MYSQL_DATABASE: allData.databaseName,
          MYSQL_USER: allData.databaseUser,
          MYSQL_PASSWORD: allData.databasePassword,
        },
        networks: ["back-network"],
      };
    } else if (allData.database === "postgresql") {
      content.services.db = {
        build: {
          context: "db",
          dockerfile: "Dockerfile",
        },
        image: `${allData.name}-db`,
        container_name: `${allData.name}-db`,
        ports: ["5432:5432"],
        volumes: ["./db/data:/var/lib/postgresql/data"],
        environment: {
          POSTGRES_PASSWORD: allData.databasePassword,
          POSTGRES_USER: allData.databaseUser,
          POSTGRES_DB: allData.databaseName,
          POSTGRES_ROOT_PASSWORD: allData.databaseRootPassword,
        },
        networks: ["back-network"],
      };
    }
  }

  // Create the file
  const dockerCompose = yaml.dump(content);
  fs.writeFileSync("docker-compose.yml", dockerCompose);
  console.log("docker-compose.yml created");
  printMessage([
    "Thank's for using docker-tool",
    "",
    "You can now run the following command to start the project:",
    "docker-compose up --build",
  ]);
}

getName();
