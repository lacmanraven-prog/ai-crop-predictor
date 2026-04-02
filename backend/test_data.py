import pandas as pd
import os

# 1. Point to the CSV file you just downloaded
csv_path = "database/tupi_weather_history.csv"

if os.path.exists(csv_path):
    # 2. Use Pandas to read the offline CSV file
    weather_data = pd.read_csv(csv_path)
    
    # 3. Print out a quick summary to the terminal
    print("========================================")
    print("🌤️ TUPI WEATHER DATA LOADED SUCCESSFULLY!")
    print("========================================")
    print(f"Total days of recorded weather: {len(weather_data)}")
    print("\nHere are the first 5 days of data:")
    print(weather_data.head())
else:
    print("Error: Could not find the CSV file. Make sure it is in the database folder!")