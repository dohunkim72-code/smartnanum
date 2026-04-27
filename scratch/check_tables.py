import paramiko

def check_tables():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        cmd = "mysql -u smartuser -psmart1234! smartnanum_db -e 'SHOW TABLES'"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        print("--- Tables in smartnanum_db ---")
        print(stdout.read().decode())
        print(stderr.read().decode())
            
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tables()
