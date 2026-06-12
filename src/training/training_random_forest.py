import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
from pathlib import Path

folder = Path(__file__).parent

df = pd.read_csv(folder / 'dataset_botnet_api_real.csv')

X = df.drop(columns=['is_attack'])
y = df['is_attack']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

rf_model = RandomForestClassifier(
    n_estimators=100,     
    max_depth=10,         
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'              
)

rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)

print(classification_report(y_test, y_pred, target_names=['Normal (0)', 'Ataque (1)']))

model_filename = 'botnet_detector_model_real.pkl'
joblib.dump(rf_model, model_filename)