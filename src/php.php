<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Ceny za gram pro jednotlivé materiály
$materialPrices = [
    'PLA' => 3,
    'PETG' => 3.5,
    'ABS' => 4,
    'ASA' => 4,
    'PC' => 7,
    'TPU' => 7
];

// Kalibrační koeficienty pro slicer
$calibrationFactor = [
    '100' => 20.70 / 21.08, // 100 % infill
    '70' => 16.57 / 21.08,  // 70 % infill
    '40' => 12.25 / 21.08,  // 40 % infill
    '15' => 8.65 / 21.08    // 15 % infill
];

// Přirážky podle kvality tisku
$printQualityMultiplier = [
    'no_quality' => 1.0,        // Nezáleží na kvalitě (0%)
    'standard_quality' => 1.05, // Standardní kvalita (+5%)
    'best_quality' => 1.15      // Nejlepší kvalita (+15%)
];

// Třída STLCalc
class STLCalc {
    private $density = 1.04;
    private $volume;
    private $fstl_handle;
    private $fstl_path;
    private $b_binary;

    public function __construct($filepath) {
        $this->b_binary = $this->IsAscii($filepath) ? FALSE : TRUE;
        $this->fstl_handle = fopen($filepath, 'rb');
        $this->fstl_path = $filepath;
    }

    public function GetVolume() {
        if (!$this->volume) {
            $this->volume = $this->CalculateVolume();
        }
        return $this->volume / 1000; // Objem v cm³
    }

    public function GetWeight() {
        $volume = $this->GetVolume();
        return $volume * $this->density; // Hmotnost v gramech
    }

    public function setDensity($density) {
        $this->density = $density;
    }

    private function CalculateVolume() {
        $totalVolume = 0;
        if ($this->b_binary) {
            $totbytes = filesize($this->fstl_path);
            $this->ReadHeader();
            $trianglesCount = $this->ReadTrianglesCount();
            while (ftell($this->fstl_handle) < $totbytes) {
                $totalVolume += $this->ReadTriangle();
            }
        }
        fclose($this->fstl_handle);
        return abs($totalVolume);
    }

    private function IsAscii($filename) {
        $fdata = file_get_contents($filename, false, null, 0, 1024);
        return strpos($fdata, 'solid') === 0;
    }

    private function ReadHeader() {
        fseek($this->fstl_handle, 80);
    }

    private function ReadTrianglesCount() {
        $length = unpack('I', fread($this->fstl_handle, 4));
        return $length[1];
    }

    private function ReadTriangle() {
        fread($this->fstl_handle, 12);
        $p1 = unpack('f3', fread($this->fstl_handle, 12));
        $p2 = unpack('f3', fread($this->fstl_handle, 12));
        $p3 = unpack('f3', fread($this->fstl_handle, 12));
        fread($this->fstl_handle, 2);
        return $this->SignedVolumeOfTriangle($p1, $p2, $p3);
    }

    private function SignedVolumeOfTriangle($p1, $p2, $p3) {
        $v321 = $p3[1] * $p2[2] * $p1[3];
        $v231 = $p2[1] * $p3[2] * $p1[3];
        $v312 = $p3[1] * $p1[2] * $p2[3];
        $v132 = $p1[1] * $p3[2] * $p2[3];
        $v213 = $p2[1] * $p1[2] * $p3[3];
        $v123 = $p1[1] * $p2[2] * $p3[3];
        return (1.0 / 6.0) * (-$v321 + $v231 + $v312 - $v132 - $v213 + $v123);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['file']) && isset($_POST['material']) && isset($_POST['strength']) && isset($_POST['print_quality']) && isset($_POST['quantity'])) {
        $file = $_FILES['file'];
        $material = $_POST['material'];
        $strength = $_POST['strength'];
        $printQuality = $_POST['print_quality'];
        $quantity = intval($_POST['quantity']);

        // Získáme objednávkové informace (pokud byly vyplněny)
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $street = $_POST['street'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $city = $_POST['city'] ?? '';
        $postal_code = $_POST['postal_code'] ?? '';
        $shipping = $_POST['shipping'] ?? '';

        // Nastavení hustoty podle výběru materiálu
        $stlCalc = new STLCalc($file['tmp_name']);
        switch ($material) {
            case 'PLA':
                $stlCalc->setDensity(1.24);
                break;
            case 'PETG':
                $stlCalc->setDensity(1.27);
                break;
            case 'ABS':
                $stlCalc->setDensity(1.04);
                break;
            case 'ASA':
                $stlCalc->setDensity(1.04);
                break;
            case 'PC':
                $stlCalc->setDensity(1.04);
                break;
            case 'TPU':
                $stlCalc->setDensity(1.24);
                break;
        }

        // Pevnost výtisku (infill)
        $calibrationKey = '100';
        switch ($strength) {
            case 'standard':
                $calibrationKey = '15';
                $strengthCz = 'Standardní';
                break;
            case 'high':
                $calibrationKey = '40';
                $strengthCz = 'Vysoká';
                break;
            case 'extra_high':
                $calibrationKey = '70';
                $strengthCz = 'Extra vysoká';
                break;
        }

        // Výpočet hmotnosti modelu
        $weightInGrams = $stlCalc->GetWeight() * $calibrationFactor[$calibrationKey];

        // Výpočet ceny (materiál × hmotnost)
        $materialCost = $weightInGrams * $materialPrices[$material];

        // Kvalita tisku přidává procenta k ceně
        $qualityMultiplier = $printQualityMultiplier[$printQuality];

        // Kvalita tisku v češtině
        switch ($printQuality) {
            case 'no_quality':
                $printQualityCz = 'Nezáleží na kvalitě';
                break;
            case 'standard_quality':
                $printQualityCz = 'Standardní kvalita';
                break;
            case 'best_quality':
                $printQualityCz = 'Nejlepší kvalita';
                break;
        }

        $totalPrice = round(($materialCost * $qualityMultiplier) * $quantity, 2);

        // Zobrazení ceny a hmotnosti
        echo json_encode(['price' => $totalPrice, 'weight' => round($weightInGrams, 2), 'message' => 'Poptávka byla úspěšně odeslána.']);

        // === ODESLÁNÍ EMAILU ===
        if (!empty($name) && !empty($email)) {
            $to = 'info@printujto.cz';  // Zde vložte vaši emailovou adresu
            $subject = '=?UTF-8?B?' . base64_encode('Nová poptávka na 3D tisk') . '?=';
            
            // Tabulka pro email
            $message = "<html><body>";
            $message .= "<h2>Nová poptávka od zákazníka:</h2>";
            $message .= "<table border='1' cellpadding='10'>";
            $message .= "<tr><td><strong>Jméno a příjmení:</strong></td><td>$name</td></tr>";
            $message .= "<tr><td><strong>Email:</strong></td><td>$email</td></tr>";
            $message .= "<tr><td><strong>Telefon:</strong></td><td>$phone</td></tr>";
            $message .= "<tr><td><strong>Adresa:</strong></td><td>$street, $city, $postal_code</td></tr>";
            $message .= "<tr><td><strong>Materiál:</strong></td><td>$material</td></tr>";
            $message .= "<tr><td><strong>Pevnost výtisku:</strong></td><td>$strengthCz</td></tr>";
            $message .= "<tr><td><strong>Kvalita tisku:</strong></td><td>$printQualityCz</td></tr>";
            $message .= "<tr><td><strong>Počet kusů:</strong></td><td>$quantity</td></tr>";
            $message .= "<tr><td><strong>Hmotnost jednoho kusu:</strong></td><td>" . round($weightInGrams, 2) . " g</td></tr>";
            $message .= "<tr><td><strong>Celková hmotnost:</strong></td><td>" . round($weightInGrams * $quantity, 2) . " g</td></tr>";
            $message .= "<tr><td><strong>Odhadovaná cena:</strong></td><td>$totalPrice Kč</td></tr>";
            $message .= "<tr><td><strong>Doprava:</strong></td><td>$shipping</td></tr>";
            $message .= "</table>";
            $message .= "</body></html>";

            // Získání obsahu STL souboru
            $fileContent = file_get_contents($file['tmp_name']);
            $encodedFileContent = chunk_split(base64_encode($fileContent));  // Base64 kódování obsahu souboru
            $fileName = $file['name'];

            // Hranice pro multipart email
            $boundary = md5(time());

            // Hlavičky emailu
            $headers = "From: objednavky@printujto.eu\r\n";
            $headers .= "Reply-To: $email\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

            // Tělo emailu s přílohou
            $body = "--$boundary\r\n";
            $body .= "Content-Type: text/html; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $body .= "$message\r\n";
            $body .= "--$boundary\r\n";
            $body .= "Content-Type: application/octet-stream; name=\"$fileName\"\r\n";
            $body .= "Content-Transfer-Encoding: base64\r\n";
            $body .= "Content-Disposition: attachment; filename=\"$fileName\"\r\n\r\n";
            $body .= "$encodedFileContent\r\n";
            $body .= "--$boundary--";

            // Odeslání emailu
            if (mail($to, $subject, $body, $headers)) {
                error_log("Poptávka byla úspěšně odeslána emailem s přílohou.");
            } else {
                error_log("Chyba při odesílání poptávky emailem.");
            }
        }

    } else {
        echo json_encode(['error' => 'Nesprávně vyplněný formulář']);
    }
} else {
    echo json_encode(['error' => 'Nepovolený typ požadavku']);
}
