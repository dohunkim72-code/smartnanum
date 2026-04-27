import paramiko

def fix_db_access():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'

    # SQL to create a new user and grant privileges
    # Note: Using mysql_native_password for better compatibility with node-mysql drivers
    sql = """
    CREATE USER IF NOT EXISTS 'smartuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'smart1234!';
    GRANT ALL PRIVILEGES ON smartnanum_db.* TO 'smartuser'@'localhost';
    FLUSH PRIVILEGES;
    """

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        # Execute SQL as root (which can use auth_socket internally if run via command line)
        cmd = f"mysql -u root -e \"{sql}\""
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        print("MySQL 사용자 생성 및 권한 부여 중...")
        print(stdout.read().decode())
        print(stderr.read().decode())
            
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_db_access()
