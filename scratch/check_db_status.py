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
    print("--- Table Row Counts ---")
    tables = ["cust", "TB_SMS_LOG"]
    for t in tables:
        count = run_remote_mysql(f"SELECT COUNT(*) FROM {t};")
        print(f"{t}: {count}")
    
    print("\n--- Recent Logs in TB_SMS_LOG ---")
    logs = run_remote_mysql("SELECT * FROM TB_SMS_LOG ORDER BY log_id DESC LIMIT 5;")
    print(logs)
