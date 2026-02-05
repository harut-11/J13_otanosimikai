// 47都道府県のデータ（日本列島の形に配置）
const PREFECTURES = {
    1: { name: '北海道', x: 720, y: 80, population: 520, income: 130, message: '広大な北の大地が我が領土となった！' },
    2: { name: '青森県', x: 760, y: 140, population: 125, income: 60, message: '本州最北端を制圧した！' },
    3: { name: '岩手県', x: 780, y: 180, population: 123, income: 60, message: '岩手の領民も支配下に！' },
    4: { name: '宮城県', x: 800, y: 210, population: 232, income: 90, message: '仙台城が陥落した！' },
    5: { name: '秋田県', x: 720, y: 180, population: 97, income: 55, message: '秋田も我が手に！' },
    6: { name: '山形県', x: 740, y: 220, population: 108, income: 58, message: '山形の地を統治す！' },
    7: { name: '福島県', x: 780, y: 250, population: 189, income: 80, message: '福島県が我が領に！' },
    8: { name: '茨城県', x: 820, y: 280, population: 291, income: 100, message: '茨城の豊かさが手に入った！' },
    9: { name: '栃木県', x: 800, y: 300, population: 196, income: 85, message: '栃木県を統治下に置いた！' },
    10: { name: '群馬県', x: 760, y: 310, population: 197, income: 85, message: '群馬県が降伏した！' },
    11: { name: '埼玉県', x: 780, y: 340, population: 726, income: 150, message: '埼玉県の豊富な人口が！' },
    12: { name: '千葉県', x: 840, y: 330, population: 622, income: 140, message: '千葉県が我が統治下に！' },
    13: { name: '東京都', x: 800, y: 360, population: 1378, income: 200, message: '東京都を制圧！これで天下取りも近い！' },
    14: { name: '神奈川県', x: 820, y: 380, population: 920, income: 180, message: '神奈川県が我が領土に！' },
    15: { name: '山梨県', x: 740, y: 350, population: 83, income: 50, message: '甲斐国が手に入った！' },
    16: { name: '長野県', x: 700, y: 310, population: 208, income: 88, message: '信州を統治す！' },
    17: { name: '新潟県', x: 720, y: 280, population: 234, income: 90, message: '新潟県が降伏した！' },
    18: { name: '富山県', x: 660, y: 290, population: 107, income: 57, message: '富山県が我が手に！' },
    19: { name: '石川県', x: 640, y: 280, population: 114, income: 60, message: '加賀国を制圧した！' },
    20: { name: '福井県', x: 620, y: 300, population: 79, income: 48, message: '越前国が統治下に！' },
    21: { name: '岐阜県', x: 680, y: 350, population: 200, income: 80, message: '美濃・飛騨が我が領に！' },
    22: { name: '静岡県', x: 720, y: 380, population: 373, income: 110, message: '遠州・駿河が統治下に！' },
    23: { name: '愛知県', x: 700, y: 410, population: 749, income: 160, message: '尾張・三河を制圧！栄える大領土だ！' },
    24: { name: '三重県', x: 680, y: 430, population: 181, income: 75, message: '伊賀・伊勢が我が領に！' },
    25: { name: '滋賀県', x: 640, y: 410, population: 141, income: 65, message: '近江国が降伏した！' },
    26: { name: '京都府', x: 620, y: 420, population: 256, income: 100, message: '京都府を制圧！古都の栄光が！' },
    27: { name: '大阪府', x: 600, y: 440, population: 884, income: 180, message: '摂津の大阪が陥落！天下の要衝を手に入れた！HALもはや軍門に下った' },
    28: { name: '神戸電子専門帝国', x: 580, y: 460, population: 546, income: 130, message: 'わが本拠地だ！' },
    29: { name: '奈良県', x: 640, y: 450, population: 124, income: 58, message: '大和国が統治下に！' },
    30: { name: '和歌山県', x: 660, y: 480, population: 94, income: 50, message: '紀州が我が領に！' },
    31: { name: '鳥取県', x: 560, y: 390, population: 57, income: 45, message: '伯耆国が降伏した！' },
    32: { name: '島根県', x: 520, y: 400, population: 69, income: 48, message: '出雲国が統治下に！' },
    33: { name: '岡山県', x: 540, y: 430, population: 190, income: 78, message: '備前国が陥落した！' },
    34: { name: '広島県', x: 500, y: 440, population: 285, income: 95, message: '安芸国が我が領に！' },
    35: { name: '山口県', x: 440, y: 470, population: 135, income: 62, message: '周防・長門が統治下に！' },
    36: { name: '徳島県', x: 540, y: 490, population: 75, income: 47, message: '阿波国が降伏した！' },
    37: { name: '香川県', x: 520, y: 510, population: 97, income: 52, message: '讃岐国が我が手に！' },
    38: { name: '愛媛県', x: 460, y: 510, population: 137, income: 62, message: '伊予国が統治下に！' },
    39: { name: '高知県', x: 500, y: 540, population: 71, income: 45, message: '土佐国が陥落した！' },
    40: { name: '福岡県', x: 370, y: 510, population: 510, income: 120, message: '筑前・筑後が我が領に！九州進出成功！' },
    41: { name: '佐賀県', x: 320, y: 500, population: 83, income: 50, message: '肥前国が統治下に！' },
    42: { name: '長崎県', x: 300, y: 470, population: 137, income: 62, message: '肥前北部が我が手に！' },
    43: { name: '熊本県', x: 340, y: 540, population: 182, income: 75, message: '肥後国が降伏した！' },
    44: { name: '大分県', x: 400, y: 530, population: 114, income: 57, message: '豊後国が統治下に！' },
    45: { name: '宮崎県', x: 400, y: 580, population: 107, income: 55, message: '日向国が我が領に！' },
    46: { name: '鹿児島県', x: 340, y: 610, population: 165, income: 70, message: '薩摩国が陥落した！' },
    47: { name: '沖縄県', x: 380, y: 680, population: 148, income: 65, message: '琉球が統治下に！東の端まで！' }
};
// 兵庫県を「神戸電子専門帝国」に変更
PREFECTURES[28].name = '神戸電子専門帝国';

// 隣接関係マッピング
const ADJACENT_TERRITORIES = {
    1: [17], // 北海道
    2: [3, 5], // 青森
    3: [2, 4, 7, 5], // 岩手
    4: [3, 7, 6], // 宮城
    5: [2, 3, 6], // 秋田
    6: [5, 7, 4, 17], // 山形
    7: [3, 6, 4, 8, 9, 10], // 福島
    8: [7, 9, 12], // 茨城
    9: [7, 8, 10, 11], // 栃木
    10: [9, 11, 16, 17], // 群馬
    11: [9, 10, 12, 13, 15], // 埼玉
    12: [8, 11, 13, 14], // 千葉
    13: [11, 12, 14, 15], // 東京
    14: [13, 15], // 神奈川
    15: [13, 14, 22, 16], // 山梨
    16: [15, 10, 17, 21, 22], // 長野
    17: [1, 6, 10, 16, 18, 19], // 新潟
    18: [17, 19, 20, 21], // 富山
    19: [17, 18, 20], // 石川
    20: [18, 19, 21, 25], // 福井
    21: [16, 22, 23, 25, 20, 18], // 岐阜
    22: [16, 15, 21, 23], // 静岡
    23: [22, 21, 25, 26, 27], // 愛知
    24: [23, 25, 26, 30], // 三重
    25: [20, 21, 23, 24, 26, 29], // 滋賀
    26: [25, 23, 27, 29], // 京都
    27: [26, 23, 28, 29], // 大阪
    28: [27, 29, 30, 34], // 兵庫（神戸電子専門帝国）
    29: [25, 26, 27, 28, 24, 30], // 奈良
    30: [29, 24, 28, 39], // 和歌山
    31: [32, 33], // 鳥取
    32: [31, 33, 34], // 島根
    33: [31, 32, 34, 35], // 岡山
    34: [28, 32, 33, 35, 38], // 広島
    35: [33, 34, 36, 37, 38], // 山口
    36: [35, 37, 39], // 徳島
    37: [35, 36, 38], // 香川
    38: [34, 35, 37, 39, 44], // 愛媛
    39: [36, 38, 30], // 高知
    40: [41, 42, 43], // 福岡
    41: [40, 42], // 佐賀
    42: [40, 41], // 長崎
    43: [40, 44, 45], // 熊本
    44: [43, 38, 45], // 大分
    45: [43, 44, 46], // 宮崎
    46: [45, 47], // 鹿児島
    47: [46] // 沖縄
};

// 敵君主のリスト（坪内を除外）
const ENEMIES = [
    { id: 1, name: '織田信長', strongholds: [23, 21], color: '#e74c3c' },
    { id: 2, name: '豊臣秀吉', strongholds: [27, 26], color: '#3498db' },
    { id: 3, name: '徳川家康', strongholds: [13, 14], color: '#2ecc71' },
    { id: 4, name: '上杉謙信', strongholds: [17, 16], color: '#f39c12' },
    { id: 5, name: '武田信玄', strongholds: [15, 22], color: '#9b59b6' },
    { id: 6, name: '斎藤道三', strongholds: [21, 16], color: '#e67e22' },
    { id: 7, name: '青石神', strongholds: [11, 10], color: '#1abc9c' },
    { id: 8, name: '島津義久', strongholds: [46, 45], color: '#34495e' },
    { id: 9, name: '長谷川', strongholds: [34, 35], color: '#d35400' },
    { id: 10, name: '今川義元', strongholds: [22, 23], color: '#c0392b' }
];
