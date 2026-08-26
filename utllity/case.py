import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()


def generate_fbi_case_file(target_sections=30, output_file="fbi_case_file_265A.txt"):
    case_id = f"265A-{fake.state_abbr()}-{fake.random_number(digits=6)}"
    lead_agent = f"Special Agent {fake.name()} (SA)"
    syndicate_name = f"The {fake.last_name()} Syndicate"

    # Core Network Entities to ensure cross-referencing without repetition
    roles = ['Boss', 'Underboss', 'Capo', 'Financial Handler', 'Logistics Lead', 'Enforcer', 'Front Business Owner']
    suspects = [{'name': fake.name(), 'alias': f"{fake.first_name()} '{fake.word().capitalize()}' {fake.last_name()}",
                 'role': r} for r in roles]
    shell_companies = [fake.company() for _ in range(5)]

    with open(output_file, "w", encoding="utf-8") as f:
        # Administrative Header
        f.write(f"FEDERAL BUREAU OF INVESTIGATION\nCLASSIFICATION: UNCLASSIFIED//FOR OFFICIAL USE ONLY\n")
        f.write(f"FILE NUMBER: {case_id}\nOFFICE OF ORIGIN: {fake.city()} FIELD OFFICE\n")
        f.write(f"INVESTIGATIVE TITLE: {syndicate_name.upper()} - RICO / MONEY LAUNDERING\n")
        f.write("=" * 75 + "\n\n")

        # Module 1: FD-263 Summary
        f.write(f"SECTION I: FD-263 INVESTIGATIVE SUMMARY\n")
        f.write(f"Lead Agent: {lead_agent}\n\n1. TARGET MATRIX:\n")
        for s in suspects:
            f.write(f" - TARGET: {s['name']} (AKA {s['alias']}) | Role: {s['role']}\n")
        f.write("\n" + "-" * 75 + "\n\n")

        # Module 2: FD-302 Interview Reports
        f.write("SECTION II: FD-302 REPORT OF INVESTIGATION ENTRIES\n\n")
        start_date = datetime(2025, 1, 10)
        for i in range(1, 25):
            date_str = (start_date + timedelta(days=i * 5)).strftime("%m/%d/%Y")
            s1, s2 = random.sample(suspects, 2)
            shell = random.choice(shell_companies)

            f.write(f"FD-302 ENTRY #{i:03d}\n")
            f.write(f"Date of Transcription: {date_str}\n")
            f.write(f"Interviewee: {fake.name()} (Source ID: #{fake.random_number(digits=5)})\n")
            f.write(f"Location: {fake.street_address()}, {fake.city()}\n")
            f.write(f"Reporting Agents: SA {fake.name()}, SA {fake.name()}\n")
            f.write("DETAILS:\n")
            f.write(
                f"Interviewee stated that on or about {date_str}, target {s1['name']} met with {s2['name']} at premises controlled by {shell}. ")
            f.write(
                f"Subject {s1['alias']} instructed the movement of funds via account {fake.iban()} to conceal illegal proceeds. ")
            f.write(
                f"Additional associates observed near the location included vehicle plate {fake.license_plate()}.\n")
            f.write("." * 60 + "\n\n")

        # Module 3: Title III Intercept Logs
        f.write("SECTION III: TITLE III ELECTRONIC SURVEILLANCE INTERCEPT LOGS\n\n")
        for j in range(1, 40):
            timestamp = (start_date + timedelta(days=j * 2, hours=random.randint(1, 23))).strftime("%Y-%m-%d %H:%M:%S")
            s1, s2 = random.sample(suspects, 2)
            f.write(f"INTERCEPT SESSION #{j:04d} | TIMESTAMP: {timestamp}\n")
            f.write(
                f"CALL ORIGIN: {fake.phone_number()} ({s1['name']}) -> RECEIVING: {fake.phone_number()} ({s2['name']})\n")
            f.write("TRANSCRIPT SUMMARY:\n")
            f.write(f" [{s1['alias']}]: Did the delivery arrive at the warehouse in {fake.city()}?\n")
            f.write(
                f" [{s2['alias']}]: Confirmed. Crypto wallet {fake.cryptocurrency_code()} received the deposit.\n")
            f.write("-" * 50 + "\n\n")

    print(f"Generated case file: {output_file}")


generate_fbi_case_file()