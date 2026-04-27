import paramiko
import sys

def check_sms_log():
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect('210.114.22.136', username='root', password='Ch070809')
        
        # % 기호를 파이썬 문자열에서 제대로 처리하기 위해 %% 사용
        sql = "SELECT * FROM TB_SMS_LOG WHERE reg_date >= CURDATE() ORDER BY reg_date DESC;"
        command = f"mysql -u smartuser -p'smart1234!' smartnanum_db -e \"{sql}\""
        
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        if output:
            print("=== SMS LOG 결과 ===")
            print(output)
        else:
            print("로그가 발견되지 않았습니다.")
            if error:
                print("에러 발생:", error)
                
        ssh.close()
    except Exception as e:
        print("연결 중 오류 발생:", str(e))

if __name__ == "__main__":
    check_sms_log()
