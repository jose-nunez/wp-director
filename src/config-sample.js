/*********************************************************
* Make sure to change these values!
* You dont want to delte and overide another site 
* CRITICAL SETTINGS
*********************************************************/
exports.v_user_name = ''; //VESTA EXISTING OR NEW USER NAME
exports.v_user_password = ''; /*VESTA NEW USER PASSWORD*/
exports.v_user_email = ''; /*VESTA NEW USER EMAIL*/

exports.domain_name = 'test.myloveddomain.com.au'; //SITE FULL URL. No http or https

exports.db_name_sufix = 'db'; //DATABASE SUFIX NAME (WILL ADD VESTA USER NAME AS PREFIX)
exports.db_user_sufix = 'us'; //DATABASE SUFIX USER (WILL ADD VESTA USER NAME AS PREFIX)
exports.db_pass = ''; /* DATABASE USER PASSWORD */

exports.force_download_backups = false;

/* New Wordpress install settings *********************************************************/
exports.title = ''; /* SITE TITLE */
exports.admin_user = ''; /* ADMIN USER NAME */
exports.admin_password = ''; /* ADMIN PASSWORD*/
exports.admin_email = ''; /* ADMIN EMAIL */
exports.skip_email = true; /* SKIP EMAIL NOTIFICATION */


let prebuilds_path = '/home/admin/storage/'; //local path or url for custom plugins and themes
exports.install_themes = [
	//Second value inicates to activate the theme
	// [prebuilds_path+'themes/'+'MyTheme.zip',false],
	// [prebuilds_path+'themes/'+'MyChildTheme.zip',true],
];
exports.install_plugins = [
	['woocommerce',true],
	// [prebuilds_path+'plugins/'+'MyPlugin.zip',true],
];

/* BACKUP RESTORE *********************************************************/
exports.backup_ftp_connection = {
	host:'ftp.myftplovedhost.com.au',
	user:'myusername',
	password:'mypassword'
};
exports.remote_backup_dir = '/path/to/backups/'; //Make sure the correct path whether you're using FTP or HTTP download protocol
exports.manual_backup_db = 'dump_script.sql'; // sql|sql.gz file
exports.manual_backup_files = 'public_html.zip'; // zip file. Must be the root folder public_html
exports.original_domain = 'www.myloveddomain.com.au';//FULL URL. To be replaced on the DB. NO http or https!! NO TRAILING SLASH!!!!!
exports.original_path = '/path/to/public_html';//Domain root folder. To be replaced on the DB. NO TRAILING SLASH!!!!!