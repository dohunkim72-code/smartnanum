import paramiko

def test_db_login():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        # Try to login as smartuser
        cmd = "mysql -u smartuser -psmart1234! -e 'SELECT 1'"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        print("--- DB Login Test ---")
        if out: print(f"OUT: {out}")
        if err: print(f"ERR: {err}")
            
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_db_login()
