// Medical tools and calculators with enhanced functionality
let activeCalculator = null;
let calculatorHistory = [];

// IMMEDIATE FUNCTION DECLARATIONS - NO HOISTING ISSUES
function calculateEGFR(event) {
    if (event) {
        event.preventDefault();
    }
    

    
    const dob = document.getElementById('dob')?.value;
    const gender = document.getElementById('gender')?.value;
    const premature = document.getElementById('premature')?.checked;
    const height = parseFloat(document.getElementById('height')?.value);
    const creatinine = parseFloat(document.getElementById('creatinine')?.value);
    const resultElement = document.getElementById('egfr-result');
    
    if (!dob || !height || !creatinine || !resultElement) {
        if (resultElement) {
            resultElement.textContent = 'Vui lòng nhập đầy đủ thông tin';
            resultElement.style.color = '#d9534f';
        }
        return false;
    }
    
    try {
        // Calculate age in years
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Convert creatinine from µmol/L to mg/dL
        const creatinineInMgDl = creatinine * 0.0113;
        
        // Schwartz formula: eGFR = k × height(cm) / creatinine(mg/dL)
        let k;
        if (age < 1) {
            k = premature ? 0.33 : 0.45;
        } else if (age < 13) {
            k = 0.55;
        } else {
            k = gender === 'male' ? 0.70 : 0.55;
        }
        
        const egfr = (k * height) / creatinineInMgDl;
        
        resultElement.textContent = `${egfr.toFixed(1)} mL/min/1.73m²`;
        
        // Color coding based on result
        if (egfr >= 90) {
            resultElement.style.color = '#28a745'; // Green - normal
        } else if (egfr >= 60) {
            resultElement.style.color = '#ffc107'; // Yellow - mild decrease
        } else if (egfr >= 30) {
            resultElement.style.color = '#fd7e14'; // Orange - moderate decrease
        } else {
            resultElement.style.color = '#dc3545'; // Red - severe decrease
        }
        
    } catch (error) {
        console.error('Error calculating eGFR:', error);
        resultElement.textContent = 'Lỗi tính toán';
        resultElement.style.color = '#d9534f';
    }
    
    return false;
}

function calculateBSA(event) {
    if (event) {
        event.preventDefault();
    }
    

    
    const height = parseFloat(document.getElementById('bsa-height')?.value);
    const weight = parseFloat(document.getElementById('bsa-weight')?.value);
    const resultElement = document.getElementById('bsa-result');
    
    if (!height || !weight || !resultElement) {
        if (resultElement) {
            resultElement.textContent = 'Vui lòng nhập chiều cao và cân nặng';
            resultElement.style.color = '#d9534f';
        }
        return false;
    }
    
    try {
        // Mosteller formula: BSA = √[(height(cm) × weight(kg)) / 3600]
        const bsa = Math.sqrt((height * weight) / 3600);
        
        resultElement.textContent = `${bsa.toFixed(2)} m²`;
        resultElement.style.color = '#28a745';
        
    } catch (error) {
        console.error('Error calculating BSA:', error);
        resultElement.textContent = 'Lỗi tính toán';
        resultElement.style.color = '#d9534f';
    }
    
    return false;
}

// IMMEDIATE GLOBAL EXPORT
window.calculateEGFR = calculateEGFR;
window.calculateBSA = calculateBSA;

// Performance monitoring utility
const performanceMonitor = {
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// BMI Calculator
function initBMICalculator() {

    activeCalculator = 'bmi';
    
    const calculatorContainer = document.querySelector('.calculator-container');
    if (!calculatorContainer) {
        console.error('❌ Calculator container not found');
        return;
    }
    
    // Hide built-in tools
    document.querySelectorAll('[id$="-tool"]').forEach(tool => {
        tool.style.display = 'none';
    });
    
    calculatorContainer.innerHTML = `
        <div class="bmi-calculator tool-card">
            <h3>🏃‍♂️ Tính chỉ số BMI</h3>
            <p class="tool-description">Body Mass Index - Chỉ số khối cơ thể</p>
            
            <div class="calculator-form">
                <div class="input-group">
                    <label for="height">Chiều cao (cm):</label>
                    <input type="number" id="height" placeholder="Ví dụ: 170" min="50" max="250" step="0.1">
                </div>
                
                <div class="input-group">
                    <label for="weight">Cân nặng (kg):</label>
                    <input type="number" id="weight" placeholder="Ví dụ: 65" min="10" max="300" step="0.1">
                </div>
                
                <button class="btn-calculate" onclick="calculateBMI()">Tính BMI</button>
                <button class="btn-clear" onclick="clearBMI()">Xóa</button>
            </div>
            
            <div id="bmi-result" class="result-container" style="display: none;">
                <div class="result-value">
                    <h4>Kết quả BMI</h4>
                    <div class="bmi-value" id="bmi-value">0</div>
                    <div class="bmi-category" id="bmi-category">Bình thường</div>
                </div>
                
                <div class="bmi-chart">
                    <div class="bmi-ranges">
                        <div class="range underweight">Thiếu cân: < 18.5</div>
                        <div class="range normal">Bình thường: 18.5 - 24.9</div>
                        <div class="range overweight">Thừa cân: 25 - 29.9</div>
                        <div class="range obese">Béo phì: ≥ 30</div>
                    </div>
                </div>
                
                <div class="result-recommendations" id="bmi-recommendations">
                    <!-- Recommendations will be populated here -->
                </div>
            </div>
        </div>
    `;
    
    // Add real-time calculation on input
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    
    if (heightInput && weightInput) {
        [heightInput, weightInput].forEach(input => {
            input.addEventListener('input', performanceMonitor.debounce(calculateBMI, 500));
        });
    }
}

function calculateBMI() {
    const height = parseFloat(document.getElementById('height')?.value);
    const weight = parseFloat(document.getElementById('weight')?.value);
    
    if (!height || !weight || height <= 0 || weight <= 0) {
        hideBMIResult();
        return;
    }
    
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    displayBMIResult(bmi, height, weight);
    
    // Store in history
    const calculation = {
        type: 'BMI',
        timestamp: new Date(),
        inputs: { height, weight },
        result: bmi
    };
    
    addToCalculatorHistory(calculation);
}

function displayBMIResult(bmi, height, weight) {
    const resultContainer = document.getElementById('bmi-result');
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');
    const recommendations = document.getElementById('bmi-recommendations');
    
    if (!resultContainer || !bmiValue || !bmiCategory) return;
    
    bmiValue.textContent = bmi.toFixed(1);
    
    let category, color, advice;
    
    if (bmi < 18.5) {
        category = 'Thiếu cân';
        color = '#3498db';
        advice = `
            <h5>Khuyến nghị:</h5>
            <ul>
                <li>Tăng cường dinh dưỡng với thực phẩm giàu protein</li>
                <li>Ăn nhiều bữa nhỏ trong ngày</li>
                <li>Tập thể dục để tăng cơ bắp</li>
                <li>Tham khảo ý kiến bác sĩ dinh dưỡng</li>
            </ul>
        `;
    } else if (bmi >= 18.5 && bmi < 25) {
        category = 'Bình thường';
        color = '#27ae60';
        advice = `
            <h5>Khuyến nghị:</h5>
            <ul>
                <li>Duy trì chế độ ăn cân bằng</li>
                <li>Tập thể dục đều đặn 150 phút/tuần</li>
                <li>Giữ lối sống lành mạnh</li>
                <li>Kiểm tra sức khỏe định kỳ</li>
            </ul>
        `;
    } else if (bmi >= 25 && bmi < 30) {
        category = 'Thừa cân';
        color = '#f39c12';
        advice = `
            <h5>Khuyến nghị:</h5>
            <ul>
                <li>Giảm 5-10% cân nặng hiện tại</li>
                <li>Tăng hoạt động thể chất</li>
                <li>Giảm lượng calo nạp vào</li>
                <li>Tham khảo chuyên gia dinh dưỡng</li>
            </ul>
        `;
    } else {
        category = 'Béo phì';
        color = '#e74c3c';
        advice = `
            <h5>Khuyến nghị:</h5>
            <ul>
                <li>Cần giảm cân nghiêm túc</li>
                <li>Tham khảo bác sĩ chuyên khoa</li>
                <li>Xây dựng kế hoạch giảm cân an toàn</li>
                <li>Tăng cường hoạt động thể chất</li>
            </ul>
        `;
    }
    
    bmiCategory.textContent = category;
    bmiCategory.style.color = color;
    bmiValue.style.color = color;
    
    if (recommendations) {
        recommendations.innerHTML = advice;
    }
    
    resultContainer.style.display = 'block';
    
    // Highlight appropriate range in chart
    updateBMIChart(bmi);
}

function updateBMIChart(bmi) {
    const ranges = document.querySelectorAll('.bmi-ranges .range');
    ranges.forEach(range => range.classList.remove('active'));
    
    if (bmi < 18.5) {
        ranges[0]?.classList.add('active');
    } else if (bmi < 25) {
        ranges[1]?.classList.add('active');
    } else if (bmi < 30) {
        ranges[2]?.classList.add('active');
    } else {
        ranges[3]?.classList.add('active');
    }
}

function hideBMIResult() {
    const resultContainer = document.getElementById('bmi-result');
    if (resultContainer) {
        resultContainer.style.display = 'none';
    }
}

function clearBMI() {
    document.getElementById('height').value = '';
    document.getElementById('weight').value = '';
    hideBMIResult();
}

// Dosage Calculator
function initDosageCalculator() {

    activeCalculator = 'dosage';
    
    const calculatorContainer = document.querySelector('.calculator-container');
    if (!calculatorContainer) return;
    
    // Hide built-in tools
    document.querySelectorAll('[id$="-tool"]').forEach(tool => {
        tool.style.display = 'none';
    });
    
    calculatorContainer.innerHTML = `
        <div class="dosage-calculator tool-card">
            <h3>💊 Tính liều thuốc</h3>
            <p class="tool-description">Tính toán liều thuốc theo cân nặng và tuổi</p>
            
            <div class="calculator-form">
                <div class="input-group">
                    <label for="patient-weight">Cân nặng bệnh nhân (kg):</label>
                    <input type="number" id="patient-weight" placeholder="Ví dụ: 70" min="1" max="200" step="0.1">
                </div>
                
                <div class="input-group">
                    <label for="patient-age">Tuổi bệnh nhân:</label>
                    <input type="number" id="patient-age" placeholder="Ví dụ: 30" min="0" max="120">
                </div>
                
                <div class="input-group">
                    <label for="drug-concentration">Nồng độ thuốc (mg/ml):</label>
                    <input type="number" id="drug-concentration" placeholder="Ví dụ: 250" min="0.1" step="0.1">
                </div>
                
                <div class="input-group">
                    <label for="dose-per-kg">Liều/kg cân nặng (mg/kg):</label>
                    <input type="number" id="dose-per-kg" placeholder="Ví dụ: 10" min="0.1" step="0.1">
                </div>
                
                <div class="input-group">
                    <label for="frequency">Số lần uống/ngày:</label>
                    <select id="frequency">
                        <option value="1">1 lần/ngày</option>
                        <option value="2">2 lần/ngày</option>
                        <option value="3">3 lần/ngày</option>
                        <option value="4">4 lần/ngày</option>
                    </select>
                </div>
                
                <button class="btn-calculate" onclick="calculateDosage()">Tính liều</button>
                <button class="btn-clear" onclick="clearDosage()">Xóa</button>
            </div>
            
            <div id="dosage-result" class="result-container" style="display: none;">
                <div class="result-value">
                    <h4>Kết quả tính liều</h4>
                    <div class="dosage-details" id="dosage-details">
                        <!-- Dosage details will be populated here -->
                    </div>
                </div>
                
                <div class="dosage-warnings" id="dosage-warnings">
                    <h5>⚠️ Lưu ý quan trọng:</h5>
                    <ul>
                        <li>Kết quả chỉ mang tính chất tham khảo</li>
                        <li>Luôn tham khảo ý kiến bác sĩ trước khi dùng thuốc</li>
                        <li>Kiểm tra kỹ liều lượng và tần suất sử dụng</li>
                        <li>Chú ý các chống chỉ định và tác dụng phụ</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    // Add real-time calculation
    const inputs = ['patient-weight', 'patient-age', 'drug-concentration', 'dose-per-kg', 'frequency'];
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', performanceMonitor.debounce(calculateDosage, 500));
        }
    });
}

function calculateDosage() {
    const weight = parseFloat(document.getElementById('patient-weight')?.value);
    const age = parseInt(document.getElementById('patient-age')?.value);
    const concentration = parseFloat(document.getElementById('drug-concentration')?.value);
    const dosePerKg = parseFloat(document.getElementById('dose-per-kg')?.value);
    const frequency = parseInt(document.getElementById('frequency')?.value);
    
    if (!weight || !concentration || !dosePerKg || !frequency) {
        hideDosageResult();
        return;
    }
    
    const totalDailyDose = weight * dosePerKg; // mg/day
    const dosePerTime = totalDailyDose / frequency; // mg per dose
    const volumePerDose = dosePerTime / concentration; // ml per dose
    
    displayDosageResult({
        weight,
        age,
        concentration,
        dosePerKg,
        frequency,
        totalDailyDose,
        dosePerTime,
        volumePerDose
    });
    
    // Store in history
    const calculation = {
        type: 'Dosage',
        timestamp: new Date(),
        inputs: { weight, age, concentration, dosePerKg, frequency },
        result: { totalDailyDose, dosePerTime, volumePerDose }
    };
    
    addToCalculatorHistory(calculation);
}

function displayDosageResult(data) {
    const resultContainer = document.getElementById('dosage-result');
    const dosageDetails = document.getElementById('dosage-details');
    
    if (!resultContainer || !dosageDetails) return;
    
    dosageDetails.innerHTML = `
        <div class="dosage-summary">
            <div class="dose-item">
                <strong>Tổng liều/ngày:</strong> ${data.totalDailyDose.toFixed(1)} mg
            </div>
            <div class="dose-item">
                <strong>Liều mỗi lần:</strong> ${data.dosePerTime.toFixed(1)} mg
            </div>
            <div class="dose-item">
                <strong>Thể tích mỗi lần:</strong> ${data.volumePerDose.toFixed(2)} ml
            </div>
            <div class="dose-item">
                <strong>Tần suất:</strong> ${data.frequency} lần/ngày
            </div>
        </div>
        
        <div class="dosage-schedule">
            <h5>Lịch uống thuốc gợi ý:</h5>
            ${generateDosageSchedule(data.frequency)}
        </div>
    `;
    
    resultContainer.style.display = 'block';
}

function generateDosageSchedule(frequency) {
    const schedules = {
        1: ['Sáng: 8:00'],
        2: ['Sáng: 8:00', 'Tối: 20:00'],
        3: ['Sáng: 8:00', 'Trưa: 14:00', 'Tối: 20:00'],
        4: ['Sáng: 8:00', 'Trưa: 14:00', 'Chiều: 18:00', 'Tối: 22:00']
    };
    
    const schedule = schedules[frequency] || schedules[1];
    return schedule.map(time => `<div class="schedule-item">${time}</div>`).join('');
}

function hideDosageResult() {
    const resultContainer = document.getElementById('dosage-result');
    if (resultContainer) {
        resultContainer.style.display = 'none';
    }
}

function clearDosage() {
    ['patient-weight', 'patient-age', 'drug-concentration', 'dose-per-kg'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    
    const frequency = document.getElementById('frequency');
    if (frequency) frequency.value = '1';
    
    hideDosageResult();
}

// Unit Converter
function initUnitConverter() {

    activeCalculator = 'unit';
    
    const calculatorContainer = document.querySelector('.calculator-container');
    if (!calculatorContainer) return;
    
    // Hide built-in tools
    document.querySelectorAll('[id$="-tool"]').forEach(tool => {
        tool.style.display = 'none';
    });
    
    calculatorContainer.innerHTML = `
        <div class="unit-converter tool-card">
            <h3>📏 Đổi đơn vị y tế</h3>
            <p class="tool-description">Chuyển đổi các đơn vị đo lường trong y tế</p>
            
            <div class="converter-tabs">
                <button class="tab-btn active" onclick="switchConverterTab('weight')">Cân nặng</button>
                <button class="tab-btn" onclick="switchConverterTab('volume')">Thể tích</button>
                <button class="tab-btn" onclick="switchConverterTab('temperature')">Nhiệt độ</button>
            </div>
            
            <div id="weight-converter" class="converter-section active">
                <div class="conversion-row">
                    <div class="input-group">
                        <input type="number" id="weight-input" placeholder="Nhập số" step="0.001">
                        <select id="weight-from">
                            <option value="kg">Kilogram (kg)</option>
                            <option value="g">Gram (g)</option>
                            <option value="mg">Milligram (mg)</option>
                            <option value="mcg">Microgram (mcg)</option>
                            <option value="lb">Pound (lb)</option>
                            <option value="oz">Ounce (oz)</option>
                        </select>
                    </div>
                    
                    <div class="equals">=</div>
                    
                    <div class="input-group">
                        <input type="text" id="weight-result" readonly placeholder="Kết quả">
                        <select id="weight-to">
                            <option value="g">Gram (g)</option>
                            <option value="kg">Kilogram (kg)</option>
                            <option value="mg">Milligram (mg)</option>
                            <option value="mcg">Microgram (mcg)</option>
                            <option value="lb">Pound (lb)</option>
                            <option value="oz">Ounce (oz)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div id="volume-converter" class="converter-section">
                <div class="conversion-row">
                    <div class="input-group">
                        <input type="number" id="volume-input" placeholder="Nhập số" step="0.001">
                        <select id="volume-from">
                            <option value="l">Liter (L)</option>
                            <option value="ml">Milliliter (mL)</option>
                            <option value="ul">Microliter (μL)</option>
                            <option value="fl_oz">Fluid Ounce (fl oz)</option>
                            <option value="cup">Cup</option>
                            <option value="tsp">Teaspoon (tsp)</option>
                            <option value="tbsp">Tablespoon (tbsp)</option>
                        </select>
                    </div>
                    
                    <div class="equals">=</div>
                    
                    <div class="input-group">
                        <input type="text" id="volume-result" readonly placeholder="Kết quả">
                        <select id="volume-to">
                            <option value="ml">Milliliter (mL)</option>
                            <option value="l">Liter (L)</option>
                            <option value="ul">Microliter (μL)</option>
                            <option value="fl_oz">Fluid Ounce (fl oz)</option>
                            <option value="cup">Cup</option>
                            <option value="tsp">Teaspoon (tsp)</option>
                            <option value="tbsp">Tablespoon (tbsp)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div id="temperature-converter" class="converter-section">
                <div class="conversion-row">
                    <div class="input-group">
                        <input type="number" id="temp-input" placeholder="Nhập nhiệt độ" step="0.1">
                        <select id="temp-from">
                            <option value="c">Celsius (°C)</option>
                            <option value="f">Fahrenheit (°F)</option>
                            <option value="k">Kelvin (K)</option>
                        </select>
                    </div>
                    
                    <div class="equals">=</div>
                    
                    <div class="input-group">
                        <input type="text" id="temp-result" readonly placeholder="Kết quả">
                        <select id="temp-to">
                            <option value="f">Fahrenheit (°F)</option>
                            <option value="c">Celsius (°C)</option>
                            <option value="k">Kelvin (K)</option>
                        </select>
                    </div>
                </div>
                
                <div class="temp-references">
                    <h5>Tham khảo nhiệt độ cơ thể:</h5>
                    <div class="temp-ref-grid">
                        <div>Bình thường: 36.1-37.2°C (97-99°F)</div>
                        <div>Sốt nhẹ: 37.3-38.0°C (99.1-100.4°F)</div>
                        <div>Sốt cao: > 38.0°C (> 100.4°F)</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for conversions
    initUnitConverterListeners();
}

function initUnitConverterListeners() {
    // Weight conversion
    const weightInput = document.getElementById('weight-input');
    const weightFrom = document.getElementById('weight-from');
    const weightTo = document.getElementById('weight-to');
    
    if (weightInput && weightFrom && weightTo) {
        [weightInput, weightFrom, weightTo].forEach(element => {
            element.addEventListener('input', () => convertWeight());
            element.addEventListener('change', () => convertWeight());
        });
    }
    
    // Volume conversion  
    const volumeInput = document.getElementById('volume-input');
    const volumeFrom = document.getElementById('volume-from');
    const volumeTo = document.getElementById('volume-to');
    
    if (volumeInput && volumeFrom && volumeTo) {
        [volumeInput, volumeFrom, volumeTo].forEach(element => {
            element.addEventListener('input', () => convertVolume());
            element.addEventListener('change', () => convertVolume());
        });
    }
    
    // Temperature conversion
    const tempInput = document.getElementById('temp-input');
    const tempFrom = document.getElementById('temp-from');
    const tempTo = document.getElementById('temp-to');
    
    if (tempInput && tempFrom && tempTo) {
        [tempInput, tempFrom, tempTo].forEach(element => {
            element.addEventListener('input', () => convertTemperature());
            element.addEventListener('change', () => convertTemperature());
        });
    }
}

function switchConverterTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update converter sections
    document.querySelectorAll('.converter-section').forEach(section => section.classList.remove('active'));
    document.getElementById(`${tabName}-converter`).classList.add('active');
}

function convertWeight() {
    const input = parseFloat(document.getElementById('weight-input')?.value);
    const fromUnit = document.getElementById('weight-from')?.value;
    const toUnit = document.getElementById('weight-to')?.value;
    const resultField = document.getElementById('weight-result');
    
    if (!input || !resultField) {
        if (resultField) resultField.value = '';
        return;
    }
    
    // Convert to grams first
    const weightConversions = {
        kg: 1000,
        g: 1,
        mg: 0.001,
        mcg: 0.000001,
        lb: 453.592,
        oz: 28.3495
    };
    
    const inGrams = input * weightConversions[fromUnit];
    const result = inGrams / weightConversions[toUnit];
    
    resultField.value = formatResult(result);
}

function convertVolume() {
    const input = parseFloat(document.getElementById('volume-input')?.value);
    const fromUnit = document.getElementById('volume-from')?.value;
    const toUnit = document.getElementById('volume-to')?.value;
    const resultField = document.getElementById('volume-result');
    
    if (!input || !resultField) {
        if (resultField) resultField.value = '';
        return;
    }
    
    // Convert to mL first
    const volumeConversions = {
        l: 1000,
        ml: 1,
        ul: 0.001,
        fl_oz: 29.5735,
        cup: 236.588,
        tsp: 4.92892,
        tbsp: 14.7868
    };
    
    const inML = input * volumeConversions[fromUnit];
    const result = inML / volumeConversions[toUnit];
    
    resultField.value = formatResult(result);
}

function convertTemperature() {
    const input = parseFloat(document.getElementById('temp-input')?.value);
    const fromUnit = document.getElementById('temp-from')?.value;
    const toUnit = document.getElementById('temp-to')?.value;
    const resultField = document.getElementById('temp-result');
    
    if (input === undefined || input === null || !resultField) {
        if (resultField) resultField.value = '';
        return;
    }
    
    let celsius;
    
    // Convert to Celsius first
    switch (fromUnit) {
        case 'c':
            celsius = input;
            break;
        case 'f':
            celsius = (input - 32) * 5/9;
            break;
        case 'k':
            celsius = input - 273.15;
            break;
    }
    
    // Convert from Celsius to target unit
    let result;
    switch (toUnit) {
        case 'c':
            result = celsius;
            break;
        case 'f':
            result = celsius * 9/5 + 32;
            break;
        case 'k':
            result = celsius + 273.15;
            break;
    }
    
    resultField.value = formatResult(result, 1);
}

function formatResult(value, decimals = 6) {
    if (value === 0) return '0';
    
    // For very small numbers, use scientific notation
    if (Math.abs(value) < 0.001) {
        return value.toExponential(2);
    }
    
    // For large numbers, limit decimal places
    if (Math.abs(value) > 1000) {
        return value.toFixed(2);
    }
    
    // For normal numbers, use appropriate decimal places
    return parseFloat(value.toFixed(decimals)).toString();
}

// Calculator History Management
function addToCalculatorHistory(calculation) {
    calculatorHistory.unshift(calculation);
    
    // Keep only last 10 calculations
    if (calculatorHistory.length > 10) {
        calculatorHistory = calculatorHistory.slice(0, 10);
    }
    
    // Store in localStorage
    try {
        localStorage.setItem('calculatorHistory', JSON.stringify(calculatorHistory));
    } catch (error) {
        console.warn('⚠️ Could not save calculator history:', error);
    }
}

function loadCalculatorHistory() {
    try {
        const stored = localStorage.getItem('calculatorHistory');
        if (stored) {
            calculatorHistory = JSON.parse(stored);
        }
    } catch (error) {
        console.warn('⚠️ Could not load calculator history:', error);
        calculatorHistory = [];
    }
}

function showCalculatorHistory() {
    if (calculatorHistory.length === 0) {
        alert('Chưa có lịch sử tính toán nào.');
        return;
    }
    
    const historyWindow = window.open('', 'calculatorHistory', 'width=600,height=400,scrollbars=yes');
    let html = `
        <html>
        <head>
            <title>Lịch sử tính toán</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .history-item { border-bottom: 1px solid #ccc; padding: 10px 0; }
                .timestamp { color: #666; font-size: 0.9em; }
                .calculation-type { font-weight: bold; color: #2c5aa0; }
            </style>
        </head>
        <body>
            <h2>Lịch sử tính toán</h2>
    `;
    
    calculatorHistory.forEach((calc, index) => {
        html += `
            <div class="history-item">
                <div class="calculation-type">${calc.type}</div>
                <div class="timestamp">${new Date(calc.timestamp).toLocaleString('vi-VN')}</div>
                <div class="inputs">Đầu vào: ${JSON.stringify(calc.inputs)}</div>
                <div class="result">Kết quả: ${JSON.stringify(calc.result)}</div>
            </div>
        `;
    });
    
    html += `
        </body>
        </html>
    `;
    
    historyWindow.document.write(html);
}

// Initialize tools
document.addEventListener('DOMContentLoaded', function() {
    loadCalculatorHistory();
    
    // Show tools by default when tools page is loaded
    const toolsPage = document.getElementById('tools-page');
    if (toolsPage) {
        // Initialize BMI calculator by default
        setTimeout(() => {
            if (window.location.hash === '#tools' || 
                document.querySelector('.page.active')?.id === 'tools-page') {
                initBMICalculator();
            }
        }, 100);
    }
});

// Export functions for global use
window.initBMICalculator = initBMICalculator;
window.initDosageCalculator = initDosageCalculator;
window.initUnitConverter = initUnitConverter;
window.calculateBMI = calculateBMI;
window.clearBMI = clearBMI;
window.calculateDosage = calculateDosage;
window.clearDosage = clearDosage;
window.switchConverterTab = switchConverterTab;
window.showCalculatorHistory = showCalculatorHistory;
window.calculateEGFR = calculateEGFR;
window.calculateBSA = calculateBSA;

// Also ensure they're available immediately
console.log('Tools.js loaded successfully', {
    calculateEGFR: typeof window.calculateEGFR,
    calculateBSA: typeof window.calculateBSA
});
