# WP Director
Server / Server-Client app for managing several Wordpress sites. Transfer and duplicate sites between servers. Installs Wordpress from scratch. Installs themes and plugins. Change Wordpress settings, and more.
## Under development
This project is currently under development. It needs lots of improvements.
I'm hanging this project here in case someone is interested in joining it or give me a hand on whatever is not working properly.
## Instructions
### Prerequisites
The application currently works under several specific environmental settings.
* Linux
* Node JS & NPM
* VestaCP API globally installed
* Wordpress CLI globally installed
* The application must be executed by admin user
* Mongo BD (optional)

This and few others more are basically the settings on our development server.

### How to use
The application can be called once specifying the operation to be performed, by using the setting files or run several operations separately on the app CLI.
First, you need to set the configuration files properly. YOU DON'T WANT TO DELETE ANY OF YOUR SITES BY ACCIDENT.
### Stored settings (Mongo DB), config.yml, session.yml and command line arguments
There is a sequence of configurations loading, that once are properly set by using patterns, you should set the least of options every time you want to duplicate a website or perform a WordPress installation.
... TO BE COMPLETED
## TODO List
* Password handling
* LastPass integration
* Pack sites
* Modify Wordpress core, themes or plugin settings
* Web Client
## License
This project is licensed under the GPL-3 License
