import paramiko

def check_db_schema():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect('210.114.22.136', username='root', password='Ch070809')
        # MySQL 명령어 실행
        cmd = 'mysql -u root -pCh070809 -D smartnanum_db -e "DESCRIBE TB_SMS_LOG;"'
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if output:
            print("--- Table Schema ---")
            print(output)
        if error:
            print("--- Error ---")
            print(error)
            
    finally:
        ssh.close()

if __name__ == "__main__":
    check_db_schema()
