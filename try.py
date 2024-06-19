data = 'R03-2024040472367243.csv'

file = data.split('-')[0]

print(data)
print(file)



rotation = "wm.self.pos.r"


position_data = {}; 
position_data_csv = {}


def process_csv_data(df, file):
    try:
        # Extract robot ID from the file name
        robot_id = file.filename.split('-')[0][2:]

        # Loop through each row in the DataFrame
        for index, row in df.iterrows():
            # Find columns starting with "wm.self" and extract x and y coordinates
            wm_self_columns = [col for col in df.columns if col.startswith("wm.self.pos")]
            for col in wm_self_columns:
                x = float(row[f"{col}.x"]) 
                y = float(row[f"{col}.y"])  

                # Check if robot_id already exists in the position_data dictionary
                if robot_id not in position_data_csv:
                    position_data_csv[robot_id] = []

                # Append new position data for the robot
                position_data_csv[robot_id].append({'x': x, 'y': y})

            hw_dw_columns = [column for column in df.columns if column.startswith("hw.dw.result.robot_fc.pos")]
            for column in hw_dw_columns:
                dx = float(row[f"{column}.x"])
                dy = float(row[f"{column}.y"])

                # Check if robot_id already exists in the position_data dictionary
                if robot_id not in position_data_csv:
                    position_data_csv[robot_id] = []

                # Append new position data for the robot
                position_data_csv[robot_id].append({'dx': dx, 'dy': dy})


    except KeyError as e:
        print(f"Missing column in CSV data: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"An error occurred while processing CSV data: {e}", file=sys.stderr)
        return False
    return True