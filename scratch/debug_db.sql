SELECT '--- USER DATA ---';
SELECT id, CONCAT('[', hpno, ']') as hpno_with_brackets, LENGTH(hpno) FROM cust WHERE id = 'oasis';

SELECT '--- VARIANT MATCH TEST ---';
SELECT id, hpno FROM cust WHERE hpno IN ('01035617528', '821035617528', '+821035617528');

SELECT '--- ALL USERS HPNO ---';
SELECT id, hpno FROM cust;
