import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_T6IMJNlrFG4A@ep-noisy-firefly-amfbayff-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"

DATA = {
    "Telangana": {"code": "36", "districts": {"Hyderabad": {"code": "536", "subdistricts": {"Secunderabad": {"code": "5361", "villages": [("Secunderabad","V001"),("Trimulgherry","V002"),("Bowenpally","V003"),("Malkajgiri","V004"),("Alwal","V005")]}, "Charminar": {"code": "5362", "villages": [("Charminar","V006"),("Falaknuma","V007"),("Chandrayangutta","V008"),("Santoshnagar","V009"),("Saidabad","V010")]}}}, "Rangareddy": {"code": "537", "subdistricts": {"Rajendranagar": {"code": "5371", "villages": [("Rajendranagar","V011"),("Attapur","V012"),("Budvel","V013"),("Kismatpur","V014"),("Shamshabad","V015")]}, "Maheshwaram": {"code": "5372", "villages": [("Maheshwaram","V016"),("Pedda Amberpet","V017"),("Yacharam","V018"),("Kadthal","V019"),("Kothur","V020")]}}}}},
    "Maharashtra": {"code": "27", "districts": {"Mumbai": {"code": "527", "subdistricts": {"Andheri": {"code": "5271", "villages": [("Andheri East","V021"),("Andheri West","V022"),("Jogeshwari","V023"),("Vile Parle","V024"),("Santacruz","V025")]}, "Borivali": {"code": "5272", "villages": [("Borivali East","V026"),("Borivali West","V027"),("Kandivali","V028"),("Malad","V029"),("Goregaon","V030")]}}}, "Pune": {"code": "528", "subdistricts": {"Haveli": {"code": "5281", "villages": [("Kharadi","V031"),("Wagholi","V032"),("Lohegaon","V033"),("Mundhwa","V034"),("Manjari","V035")]}, "Pune City": {"code": "5282", "villages": [("Shivajinagar","V036"),("Deccan","V037"),("Kothrud","V038"),("Baner","V039"),("Aundh","V040")]}}}}},
    "Karnataka": {"code": "29", "districts": {"Bengaluru Urban": {"code": "529", "subdistricts": {"Bengaluru North": {"code": "5291", "villages": [("Hebbal","V041"),("Yelahanka","V042"),("Jakkur","V043"),("Bagalur","V044"),("Devanahalli","V045")]}, "Bengaluru South": {"code": "5292", "villages": [("Jayanagar","V046"),("JP Nagar","V047"),("Bannerghatta","V048"),("Electronic City","V049"),("Begur","V050")]}}}, "Mysuru": {"code": "530", "subdistricts": {"Mysuru North": {"code": "5301", "villages": [("Vijayanagar","V051"),("Hebbal","V052"),("Srirampura","V053"),("Nazarbad","V054"),("Saraswathipuram","V055")]}, "Mysuru South": {"code": "5302", "villages": [("Chamundipuram","V056"),("Lakshmipuram","V057"),("Mandi Mohalla","V058"),("Udayagiri","V059"),("Alanahalli","V060")]}}}}},
    "Tamil Nadu": {"code": "33", "districts": {"Chennai": {"code": "533", "subdistricts": {"Chennai North": {"code": "5331", "villages": [("Tondiarpet","V061"),("Royapuram","V062"),("Tiruvottiyur","V063"),("Madhavaram","V064"),("Manali","V065")]}, "Chennai South": {"code": "5332", "villages": [("Adyar","V066"),("Velachery","V067"),("Sholinganallur","V068"),("Perungudi","V069"),("Thoraipakkam","V070")]}}}, "Coimbatore": {"code": "534", "subdistricts": {"Coimbatore North": {"code": "5341", "villages": [("Singanallur","V071"),("Ganapathy","V072"),("Podanur","V073"),("Peelamedu","V074"),("Ramanathapuram","V075")]}, "Coimbatore South": {"code": "5342", "villages": [("RS Puram","V076"),("Saibaba Colony","V077"),("Vadavalli","V078"),("Thondamuthur","V079"),("Kinathukadavu","V080")]}}}}},
    "Delhi": {"code": "07", "districts": {"New Delhi": {"code": "507", "subdistricts": {"Connaught Place": {"code": "5071", "villages": [("Connaught Place","V081"),("Karol Bagh","V082"),("Paharganj","V083"),("Rajendra Place","V084"),("Patel Nagar","V085")]}, "South Delhi": {"code": "5072", "villages": [("Hauz Khas","V086"),("Greater Kailash","V087"),("Saket","V088"),("Malviya Nagar","V089"),("Vasant Kunj","V090")]}}}, "East Delhi": {"code": "508", "subdistricts": {"Shahdara": {"code": "5081", "villages": [("Shahdara","V091"),("Vivek Vihar","V092"),("Preet Vihar","V093"),("Laxmi Nagar","V094"),("Nirman Vihar","V095")]}, "Patparganj": {"code": "5082", "villages": [("Patparganj","V096"),("Mayur Vihar","V097"),("Kondli","V098"),("Mandawali","V099"),("Trilokpuri","V100")]}}}}}
}

def import_data():
    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    print("Inserting India as country...")
    cursor.execute("INSERT INTO countries (name, code) VALUES (%s, %s) ON CONFLICT (code) DO NOTHING RETURNING id", ("India", "IN"))
    result = cursor.fetchone()
    if result:
        country_id = result[0]
    else:
        cursor.execute("SELECT id FROM countries WHERE code = 'IN'")
        country_id = cursor.fetchone()[0]
    print(f"Country ID: {country_id}")

    for state_name, state_data in DATA.items():
        print(f"Inserting state: {state_name}")
        cursor.execute('INSERT INTO states (name, code, "countryId") VALUES (%s, %s, %s) ON CONFLICT (code, "countryId") DO NOTHING RETURNING id', (state_name, state_data["code"], country_id))
        result = cursor.fetchone()
        if result:
            state_id = result[0]
        else:
            cursor.execute('SELECT id FROM states WHERE code = %s AND "countryId" = %s', (state_data["code"], country_id))
            state_id = cursor.fetchone()[0]

        for district_name, district_data in state_data["districts"].items():
            print(f"  Inserting district: {district_name}")
            cursor.execute('INSERT INTO districts (name, code, "stateId") VALUES (%s, %s, %s) ON CONFLICT (code, "stateId") DO NOTHING RETURNING id', (district_name, district_data["code"], state_id))
            result = cursor.fetchone()
            if result:
                district_id = result[0]
            else:
                cursor.execute('SELECT id FROM districts WHERE code = %s AND "stateId" = %s', (district_data["code"], state_id))
                district_id = cursor.fetchone()[0]

            for sd_name, sd_data in district_data["subdistricts"].items():
                print(f"    Inserting subdistrict: {sd_name}")
                cursor.execute('INSERT INTO sub_districts (name, code, "districtId") VALUES (%s, %s, %s) ON CONFLICT (code, "districtId") DO NOTHING RETURNING id', (sd_name, sd_data["code"], district_id))
                result = cursor.fetchone()
                if result:
                    sd_id = result[0]
                else:
                    cursor.execute('SELECT id FROM sub_districts WHERE code = %s AND "districtId" = %s', (sd_data["code"], district_id))
                    sd_id = cursor.fetchone()[0]

                for village_name, village_code in sd_data["villages"]:
                    cursor.execute('INSERT INTO villages (name, code, "subDistrictId") VALUES (%s, %s, %s) ON CONFLICT (code) DO NOTHING', (village_name, village_code, sd_id))

    conn.commit()
    cursor.close()
    conn.close()
    print("\n✅ Data import complete!")
    print("  - 5 States")
    print("  - 10 Districts")
    print("  - 20 SubDistricts")
    print("  - 100 Villages")

if __name__ == "__main__":
    import_data()