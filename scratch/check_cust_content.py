import paramiko

def run_remote_mysql(sql_command):
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect('210.114.22.136', username='root', password='Ch070809')
        full_command = f'mysql -u root -pCh070809 smartnanum_db -e "{sql_command}"'
        stdin, stdout, stderr = ssh.exec_command(full_command)
        out = stdout.read().decode().strip()
        ssh.close()
        return out
    except:
        return ""

if __name__ == "__main__":
    print("--- Content of 'cust' table ---")
    content = run_remote_mysql("SELECT * FROM cust;")
    print(content)
