# OARE Web

This is a monorepository containing all code necessary to run oare.byu.edu. This guide will explain how to set up the project locally and contains other information you will need to know as a developer on the project. The instructions vary slightly for Mac and Windows users, so be sure to follow the directions carefully. If you are using Windows, a few extra steps may be necessary.

## Create an OARE account

In order to access all parts of the website, you will need to have an admin account on the project website. To do so, navigate to the [site] (https://oare.byu.edu) and click "Login" at the top right.

![](./readme-imgs/oare-login.png)

Then select the "Register for free" option.

![](./readme-imgs/oare-register.png)

Fill out the form to create a new user account and make note of the password chose. Once your account is created, ask the team lead to grant you administrator permissions. This will allow you to access all parts of the website.

## Install WSL 2 (Windows Only)

Running this project locally on a Windows machine will require WSL 2 to be installed. WSL, short for Windows Subsystem for Linux, is a utility created by Microsoft that allows you to run a full Linux environment on your machine. With WSL installed, your machine will be able to handle all of the packages and commands that our project uses.

If you are using a Mac, you can skip this step. Because macOS is UNIX-based, all the necessary commands will run properly by default.

For most PC machines, simply open Powershell as Administrator and run the following command to install WSL:

```
$ wsl --install
```

This command will download WSL, set version 2 as the default (version 2 is required for our project to work), and set Ubuntu as the default Linux distribution. On most machines, this will work properly. If it does not work on your PC, follow the detailed instructions [here](https://docs.microsoft.com/en-us/windows/wsl/install-manual) to install WSL 2 manually. Make sure to set the default version to WSL 2.

## Install Docker

This project uses Docker to locally run a MySQL server. If you are not familiar with Docker, it lets you run apps inside of "containers", which are kind of like very lightweight virtual machines.

First, download Docker at this link: https://www.docker.com/products/docker-desktop. After downloading Docker, you will need to start the Docker Daemon. See the following instructions depending on your operating system.

### Mac

Search for Docker in Spotlight Search or the Application Launchpad and click on the first result.

![](./readme-imgs/finder-docker.png)

You should see a little whale icon in the status bar. Once it stops moving, the Docker Daemon is running.

![](./readme-imgs/nav-docker-mac.png)

### Windows

Search for the Docker application and open it. If WSL 2 is not properly installed, an error will appear on startup. Make sure WSL 2 is installed properly before proceeding.

In the system tray at the bottom-right of your screen, a whale icon should appear. It may appear in the submenu accessed via the arrow icon. Once the whale icon stops moving, the Docker Daemon is running.

## Get Access to the Github Repository

If you do not have a Github account, create one. Then, add an SSH key to your account so you have command line access by following [these instructions](https://docs.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account).

You will need to be added as a collaborator to the Github project before you can download the code. The team lead will need to invite you and you will need to accept the invitation in your email.

### For the Team Lead

To add someone as a collaborator to the project, you will need to sign into the oaregithub account on Github. Navigate to the oare-mono project, and then click on Settings.

![](./readme-imgs/github-settings.png)

Now click on "Invite a collaborator" and type the email or Github username of the new collaborator.

![](./readme-imgs/invite-collab.png)

The new collaborator will need to accept the invitation sent to their email, and then they will have read/write access to the repository.

## Set up AWS

User authentication for the website is done with Firebase, an easy-to-use development toolkit created by Google. A private key for Firebase is stored in an S3 bucket on AWS. As such, the site will not work locally unless you have AWS access. You will also need to configure the `aws` command line utility.

The team lead will create an AWS account for you. This will allow you to access the AWS console where the site is hosted. Once the team lead creates the account, you will receive an email with login instructions. You will be asked to change your password the first time you access the console. Once your account is active, you will be ready to configure the `aws` command line utility.

First, install the `aws` CLI by following [these instructions](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html). The instructions are slightly different for each operating system, so be sure to follow the correct instructions.

Next, make sure you have your AWS access key ID and secret access key. The team lead will give these to you when you are added as a user in AWS.

The easiest way to configure your account is to run `aws configure` from the command line, and then input your keys. For more information, see [this documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html).

### For the team lead

You will need to create an IAM account in AWS for the new developer. In the IAM dashboard, click "Users" and then "Add user".

![](./readme-imgs/iam-users.png)

![](./readme-imgs/add-user.png)

Create a user name (can just be the developer's first and last name), then check both the "Programmatic access" and "AWS Management Console access" boxes. Leave the "Autogenerated password" radio button selected, and leave the "User must create a new password at next sign-in" box checked. Click "Next: Permissions".

Add the user to the "OareCoderAdmin" group then click "Next: Tags". Click "Next: Review". Finally, click "Create user". Make sure to send the new developer the access key ID, secret access key, and password. Make sure they can log in to the AWS console with the password.

## Clone the repository

First, clone the repository in the directory of your choice. You will be asked to authenticate using your Github credentials.

```
$ git clone https://github.com/oaregithub/oare_mono.git
```

Now change directories into the project.

```
$ cd oare_mono
```

## Configure Docker container

The monorepository contains several Docker configuration files. These files tell Docker what container images are necessary for the project to run. In our case, a `mysql` container is needed to host the local copy of the database. Before we can create that local copy of the database, we need Docker to download and configure the appropriate container image.

To configure the Docker container, simply run the following commands within the project directory:

```
$ docker-compose build
$ docker-compose up -d
```

It might take a few minutes to build the first time because Docker needs to install the required images. Running `docker-compose up -d` runs the app in detached mode, so you won't have to run these commands again unless the Docker container is uninstalled or reset.

## Create database connections

You should now have a MySQL server running in a Docker container. However, it will be empty, so we need to populate it with real data.

You will need a client that can connect to the MySQL container. We recommend [MySQL Workbench](https://dev.mysql.com/downloads/workbench/), but if you prefer some other client then that's fine too. Just note that these instructions are written for MySQL Workbench and we might have a hard time helping you if you're having problems with some other client.

You will want to create three connections in MySQL Workbench - a connection to the production database, a readonly connection to the production database, and a local connection to the local database used for development. You can name each connection whatever you want, but make sure to configure the connections as directed below.

![](./readme-imgs/create-connection.png)

### Production and read-only connections

For the production connection, create a new connection with a name of your choice. The hostname is "oare-0-3.c4t2up2es1cx.us-west-2.rds.amazonaws.com" (without the quotes). The username is "oare". Ask another team member for the password.

For the readonly connection, create another connection with a name of your choice. The hostname is the same as the production connection and the username is "oare_readonly". Again, ask another team member for the password. We recommend clicking the box that says "Store in keychain" so you don't have to type the password in every time you want to connect.

### Create a local copy of the database

Create another connection using a name of your choice. We recommend a name like "Docker OARE" or "Local OARE" to help differentiate between the local copy and the production copies. For "Hostname", put "localhost". Click "Test Connection". You will be asked for a password. The password is "example" (without the quotes). Note that we do not use Docker in production, so it's ok that the password is hardcoded in the codebase.

Now, you will need to export a copy of the production database so you can use it locally. In MySQL Workbench, open your production connection. Then go to Server > Data Export

![](./readme-imgs/data-export.png)

Select the oarebyue_0.3 schema and make sure all the tables are selected. Make sure all the checkboxes are checked under the "Objects to Export" section. Also make sure the "Create Dump in a Single Transaction" and "Include create schema" boxes are checked. Choose a location to save the dump, and then click "Start Export".

![](./readme-imgs/start-export.png)

This could take a little while. Once the export is complete, you will need to import the exported database into your local database. Open the local database connection then go to Server > Data Import.

![](./readme-imgs/upload-dump.png)

Select "Import from Self-Contained File" and choose the file that you exported in the last step. Then click "Start Import"

![](./readme-imgs/data-import.png)

This will take a while (there are over 15 million rows!). It might take a couple of hours, so be patient.

## Install Node.js and Yarn Package Manager

Running this project requires you to have [Node.js](https://nodejs.org/en/) and [Yarn Package Manager](https://yarnpkg.com) installed on your machine. If you don't already have them installed, follow the instructions below.

### Mac

There are multiple ways to download and install Node.js and Yarn. You can choose to install them however you choose following the various instructions on the Node.js and Yarn installation pages. However, the instructions below outline how to install the packages using Homebrew, which is the method we recommend.

Install Homebrew Package Manager by following the instructions on the [Homebrew site](https://brew.sh).

Once Homebrew is installed, run the following script:

```
$ brew install yarn
```

This command will install both Yarn Package Manager and Node.js (if not previously installed).

### Windows

There are multiple ways to download and install Node.js and Yarn. You can choose to install them using whatever method we choose. However, the instructions below outline the method that we recommend.

First, download the Windows Node.js installer [here](https://nodejs.org/en/).

Once Node.js is installed, run the following command to install Yarn:

```
$ npm install --global yarn
```

## Run the project

First, in the terminal, navigate to the directory where the project codebase is located.

Next, install dependencies and build the project:

```
$ yarn install
$ yarn build
```

Finally, start the local server:

```
$ yarn start
```

In your browser, navigate to http://localhost:8080 and you should see the site. Login using the account you created earlier and spend some time getting familiar with the site itself. Everything is running locally, so don't be afraid of messing anything up.

## Appendix: Elastic Beanstalk

Elastic Beanstalk basically automates the process of providing an EC2 instance and load balancer for the site. Most of the time you won't have to do anything here since the site automatically gets deployed to Elastic Beanstalk when your code is merged into the master branch of the Git repository.

If you do need to change something in EB, it will most likely be environment variables. For example, you should routinely change the password to the database. When you do, you will need to update the OARE_DB_URL environment variable with the new password value.
