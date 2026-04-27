-- 1. 은행 정보 (공통 컬럼 추가)
CREATE TABLE `bankInfo` (
  `bank_code` varchar(3) NOT NULL COMMENT '은행코드',
  `bank_name` varchar(50) NOT NULL COMMENT '은행명',
  `account_no` varchar(20) NOT NULL COMMENT '계좌번호',
  `account_holder` varchar(20) NOT NULL COMMENT '예금주',
  `referral_code` varchar(20) NOT NULL COMMENT '추천인번호',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`bank_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='은행코드 관리';

-- 2. 기초 코드 (공통 컬럼 추가)
CREATE TABLE `basicCode` (
  `base_code` varchar(50) NOT NULL COMMENT '기본코드',
  `sub_code` varchar(50) NOT NULL COMMENT '하위코드',
  `code_name` varchar(200) NOT NULL COMMENT '코드명',
  `note` varchar(256) DEFAULT NULL COMMENT '비고',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`base_code`,`sub_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='공통코드 관리';

-- 3. 거래처/기부처 마스터 (공통 컬럼 추가)
CREATE TABLE `client_master` (
  `client_no` varchar(10) NOT NULL COMMENT '거래처번호',
  `client_name` varchar(50) NOT NULL COMMENT '거래처명',
  `biz_no` varchar(15) DEFAULT NULL COMMENT '사업자번호',
  `representative` varchar(20) DEFAULT NULL COMMENT '대표자명',
  `zipcode` varchar(5) DEFAULT NULL COMMENT '우편번호',
  `address` varchar(200) DEFAULT NULL COMMENT '주소',
  `address_detail` varchar(200) DEFAULT NULL COMMENT '상세주소',
  `industry` varchar(200) DEFAULT NULL COMMENT '업태',
  `biz_type` varchar(200) DEFAULT NULL COMMENT '종목',
  `home_page` varchar(200) DEFAULT NULL COMMENT '홈페이지',
  `manager_name` varchar(20) DEFAULT NULL COMMENT '담당자명',
  `manager_hpno` varchar(20) DEFAULT NULL COMMENT '담당자휴대폰',
  `manager_email_add` varchar(50) DEFAULT NULL COMMENT '담당자이메일',
  `manager_tel` varchar(20) DEFAULT NULL COMMENT '담당자전화번호',
  `note` varchar(256) DEFAULT NULL COMMENT '비고',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`client_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='기부처 및 거래처 마스터';

-- 4. 고객 마스터 (공통 컬럼 추가)
CREATE TABLE `cust` (
  `cust_no` varchar(10) NOT NULL COMMENT '고객번호',
  `id` varchar(20) NOT NULL COMMENT '고객ID',
  `pw` varchar(256) NOT NULL COMMENT '고객비밀번호',
  `name` varchar(20) NOT NULL COMMENT '고객명',
  `email_add` varchar(50) NOT NULL COMMENT '이메일주소',
  `hpno` varchar(20) NOT NULL COMMENT '핸드폰번호',
  `referral_code` varchar(20) NOT NULL COMMENT '추천인번호',
  `note` varchar(100) COMMENT '소개자명',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`cust_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='고객정보 마스터';

-- 5. [수정됨] 기부 신청 마스터 (연도별 종합 정보)
CREATE TABLE `donation_master` (
  `cust_no` varchar(10) NOT NULL COMMENT '고객번호',
  `dona_yy` varchar(4) NOT NULL COMMENT '년도',
  `name` varchar(20) NOT NULL COMMENT '성명(신청시점)',
  `jmin1` varchar(6) NOT NULL COMMENT '주민1',
  `jmin2` varchar(7) NOT NULL COMMENT '주민2',
  `zipcode` varchar(5) NOT NULL COMMENT '우편번호',
  `address` varchar(200) NOT NULL COMMENT '주소',
  `address_detail` varchar(200) NOT NULL COMMENT '상세주소',
  `hpno` varchar(20) NOT NULL COMMENT '핸드폰번호',
  `last_amt` double NOT NULL DEFAULT 0 COMMENT '전월이월금액',
  `total_dona_amt` double NOT NULL DEFAULT 0 COMMENT '연간총기부신청금액',
  `total_real_amt` double NOT NULL DEFAULT 0 COMMENT '연간총실제기부금액',
  `total_refund_amt` double NOT NULL DEFAULT 0 COMMENT '연간총환급예상금액',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`cust_no`,`dona_yy`),
  CONSTRAINT `fk_donation_master_cust` FOREIGN KEY (`cust_no`) REFERENCES `cust` (`cust_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='연도별 기부 신청 마스터';

-- 6. [신규] 기부 신청 상세 (건별 신청 내역)
CREATE TABLE `donation_detail` (
  `cust_no` varchar(10) NOT NULL COMMENT '고객번호',
  `dona_yy` varchar(4) NOT NULL COMMENT '년도',
  `seq_no` int(11) NOT NULL COMMENT '신청순번',
  `client_no` varchar(10) NOT NULL COMMENT '기부처번호(Client_Master FK)',
  `dona_amt` double NOT NULL DEFAULT 0 COMMENT '기부신청금액',
  `pre_deposit_req_amt` double NOT NULL DEFAULT 0 COMMENT '요청선입금액',
  `real_amt` double NOT NULL DEFAULT 0 COMMENT '실제기부인정금액',
  `goods_amt` double NOT NULL DEFAULT 0 COMMENT '물품대금',
  `refund_amt` double NOT NULL DEFAULT 0 COMMENT '건별환급예상금액',
  `receipt_yn` varchar(1) NOT NULL DEFAULT 'N' COMMENT '현금영수증신청여부',
  `deposit_amt` double NOT NULL DEFAULT 0 COMMENT '실제입금금액',
  `goods_yn` varchar(1) NOT NULL DEFAULT 'N' COMMENT '대금입금여부',
  `issuance_yn` varchar(1) NOT NULL DEFAULT 'N' COMMENT '현금영수증발행여부',
  `company_name` varchar(100)  COMMENT '회사명',
  `agree1` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의1',
  `agree2` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의2',
  `agree3` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의3',
  `agree4` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의4',
  `agree5` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의5',
  `agree6` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의6',
  `agree7` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의7',
  `agree8` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의8',
  `agree9` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의9',
  `agree10` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의10',
  `agree11` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의11',
  `agree12` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의12',
  `agree13` varchar(1) NOT NULL DEFAULT 'N' COMMENT '고객동의13',
  `signature` LONGTEXT DEFAULT NULL COMMENT '신청인서명데이터(Base64)',
  `bank_code` varchar(3) DEFAULT NULL COMMENT '은행코드',
  `step_code` varchar(2) NOT NULL COMMENT '진행상태코드',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`cust_no`,`dona_yy`,`seq_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='기부 신청 상세 내역';

-- 7. 마감 일자
CREATE TABLE `endDate` (
  `dona_yy` varchar(4) NOT NULL,
  `endDate` varchar(10) NOT NULL,
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`dona_yy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- 8. 선입금 내역
CREATE TABLE `pre_deposit` (
  `dona_yy` varchar(4) NOT NULL COMMENT '년도',
  `cust_no` varchar(10) NOT NULL COMMENT '고객번호',
  `seq_no` int(11) NOT NULL COMMENT '순번',
  `deposit_type` varchar(20) NOT NULL COMMENT '입금형태',
  `deposit_amt` double NOT NULL COMMENT '입금액',
  `deposit_date` varchar(8) NOT NULL COMMENT '입금일자(YYYYMMDD)',
  `bank_name` varchar(50) NOT NULL COMMENT '은행명',
  `account_no` varchar(20) NOT NULL COMMENT '계좌번호',
  `account_holder` varchar(20) NOT NULL COMMENT '예금주',
  `issuance_yn` varchar(1) NOT NULL DEFAULT 'N' COMMENT '현금영수증발행여부',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`dona_yy`,`cust_no`,`seq_no`),
  KEY `idx_pre_deposit_cust` (`cust_no`,`dona_yy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='선입금 내역';

-- 9. 상품 마스터
CREATE TABLE `product_master` (
  `product_code` varchar(10) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `product_category` varchar(200) DEFAULT NULL,
  `product_spec` varchar(10) DEFAULT NULL,
  `unit` varchar(10) DEFAULT NULL,
  `cost_price` double DEFAULT NULL,
  `sale_price` double DEFAULT NULL,
  `manufacturer` varchar(200) DEFAULT NULL,
  `brand` varchar(200) DEFAULT NULL,
  `use_yn` varchar(1) DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- 10. 상품 입고 마스터
CREATE TABLE `product_receipt_master` (
  `receipt_yymm` varchar(6) NOT NULL,
  `client_no` varchar(10) NOT NULL,
  `product_code` varchar(10) NOT NULL,
  `seq_no` int(11) NOT NULL,
  `quantity` double DEFAULT NULL,
  `unit_price` double DEFAULT NULL,
  `total_amount` double DEFAULT NULL,
  `receipt_date` date DEFAULT NULL COMMENT '입고일자',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`receipt_yymm`,`client_no`,`product_code`,`seq_no`),
  CONSTRAINT `product_receipt_master_ibfk_1` FOREIGN KEY (`client_no`) REFERENCES `client_master` (`client_no`),
  CONSTRAINT `product_receipt_master_ibfk_2` FOREIGN KEY (`product_code`) REFERENCES `product_master` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- 11. 상품 출고 마스터
CREATE TABLE `product_release_master` (
  `client_no` varchar(10) NOT NULL,
  `product_code` varchar(10) NOT NULL,
  `cust_no` varchar(10) NOT NULL,
  `seq_no` int(11) NOT NULL,
  `quantity` double DEFAULT NULL,
  `unit_price` double DEFAULT NULL,
  `total_amount` double DEFAULT NULL,
  `release_date` date DEFAULT NULL,
  `dona_yy` varchar(4) NOT NULL,
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '입력일시',
  `reg_id` varchar(20) NOT NULL COMMENT '입력자ID',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  `upd_id` varchar(20) NOT NULL COMMENT '수정자ID',
  PRIMARY KEY (`client_no`,`product_code`,`cust_no`,`seq_no`),
  CONSTRAINT `product_release_master_ibfk_1` FOREIGN KEY (`client_no`) REFERENCES `client_master` (`client_no`),
  CONSTRAINT `product_release_master_ibfk_2` FOREIGN KEY (`product_code`) REFERENCES `product_master` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- 12. [�ű�] ���� �� �˸��� �߼� �̷� ����
CREATE TABLE `TB_SMS_LOG` (
  `log_id` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '�߼� �̷� ���� Ű',
  `cust_no` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '������ȣ',
  `send_category` varchar(10) COMMENT '�߼ۺз�',
  `receiver_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '���� �޴��� ��ȣ',
  `msg_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '�޽��� ����',
  `msg_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SMS' COMMENT '�޽��� ���� (SMS, LMS, ALIM_TALK)',
  `send_stat` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING' COMMENT '�߼� ���� (SUCCESS, FAIL, PENDING)',
  `error_msg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '���� �޽���',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '�Է��Ͻ�',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='���� �� �˸��� �߼� �̷� ����';
