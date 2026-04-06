import psycopg2

conn = psycopg2.connect('postgresql://neondb_owner:npg_T6IMJNlrFG4A@ep-noisy-firefly-amfbayff-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require')
cur = conn.cursor()

cur.execute('SELECT COUNT(*) FROM states')
print('States:', cur.fetchone()[0])

cur.execute('SELECT COUNT(*) FROM villages')
print('Villages:', cur.fetchone()[0])

conn.close()