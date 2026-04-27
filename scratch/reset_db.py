import paramiko

def reset_database():
    host = '210.114.22.136'
    user = 'root'
    pw = 'Ch070809'
    db_user = 'smartuser'
    db_pw = 'smart1234!'
    db_name = 'smartnanum_db'

    tables = [
        'donation_detail',
        'donation_master',
        'pre_deposit',
        'product_release_master',
        'product_receipt_master',
        'TB_SMS_LOG',
        'cust',
        'client_master',
        'product_master',
        'bankInfo',
        'basicCode',
        'endDate'
    ]

    sql_parts = ["SET FOREIGN_KEY_CHECKS = 0;"]
    for table in tables:
        sql_parts.append(f"TRUNCATE TABLE {table};")
    sql_parts.append("SET FOREIGN_KEY_CHECKS = 1;")
    
    full_sql = " ".join(sql_parts)

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=pw)
        
        command = f'mysql -u {db_user} -p\"{db_pw}\" {db_name} -e \"{full_sql}\"'
        print(f"Executing reset on server...")
        
        stdin, stdout, stderr = ssh.exec_command(command)
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        if err:
            print(f"Error: {err}")
        else:
            print("Successfully initialized all tables!")
            print(out)
            
        ssh.close()
    except Exception as e:
        print(f"Failed to connect or execute: {e}")

if __name__ == "__main__":
    reset_database()
