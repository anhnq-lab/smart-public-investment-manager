/**
 * Replace Phụ lục content with proper HTML tables for beautiful rendering
 */
const fs = require('fs');
const path = require('path');

const legalDataPath = path.join(__dirname, '..', 'features', 'legal-documents', 'legalData.ts');
let data = fs.readFileSync(legalDataPath, 'utf-8');

// Helper: find and replace content for a specific Phụ lục article by its id  
function replaceArticleContent(id, newContent, newSummary) {
    // Find the article block by id
    const idPattern = `id: '${id}',`;
    const idx = data.indexOf(idPattern);
    if (idx === -1) { console.error(`Cannot find ${id}`); return false; }

    // Find the content field within this article block
    const contentStart = data.indexOf('content: `', idx);
    if (contentStart === -1 || contentStart - idx > 5000) { console.error(`Cannot find content for ${id}`); return false; }
    const contentValueStart = contentStart + 'content: `'.length;

    // Find closing backtick - need to handle escaped backticks
    let contentEnd = contentValueStart;
    while (contentEnd < data.length) {
        if (data[contentEnd] === '`' && data[contentEnd - 1] !== '\\') break;
        contentEnd++;
    }

    // Replace content
    data = data.substring(0, contentValueStart) + newContent + data.substring(contentEnd);

    // Also replace summary if provided
    if (newSummary) {
        const newIdx = data.indexOf(idPattern); // re-find since indices changed
        const summaryStart = data.indexOf("summary: '", newIdx);
        if (summaryStart !== -1 && summaryStart - newIdx < 3000) {
            const summaryValueStart = summaryStart + "summary: '".length;
            let summaryEnd = summaryValueStart;
            while (summaryEnd < data.length) {
                if (data[summaryEnd] === "'" && data[summaryEnd - 1] !== '\\') break;
                summaryEnd++;
            }
            data = data.substring(0, summaryValueStart) + newSummary.replace(/'/g, "\\'") + data.substring(summaryEnd);
        }
    }

    console.log(`✅ ${id} updated`);
    return true;
}

// ==============================
// PHỤ LỤC I - Mã tỉnh/thành phố
// ==============================
const pl1Content = `Bảng ký hiệu mã tỉnh/thành phố trực thuộc trung ương nơi thực hiện quy hoạch, dự án ĐTXD/công trình xây dựng.
(Ban hành kèm theo Thông tư số 24/2025/TT-BXD ngày 29/08/2025 của Bộ trưởng Bộ Xây dựng)

<table>
<thead><tr><th>STT</th><th>Tên đơn vị hành chính</th><th>Mã</th></tr></thead>
<tbody>
<tr><td class="col-stt">1</td><td>Thành phố Hà Nội</td><td class="col-code">01</td></tr>
<tr><td class="col-stt">2</td><td>Tỉnh Cao Bằng</td><td class="col-code">04</td></tr>
<tr><td class="col-stt">3</td><td>Tỉnh Tuyên Quang</td><td class="col-code">08</td></tr>
<tr><td class="col-stt">4</td><td>Tỉnh Điện Biên</td><td class="col-code">11</td></tr>
<tr><td class="col-stt">5</td><td>Tỉnh Lai Châu</td><td class="col-code">12</td></tr>
<tr><td class="col-stt">6</td><td>Tỉnh Sơn La</td><td class="col-code">14</td></tr>
<tr><td class="col-stt">7</td><td>Tỉnh Lào Cai</td><td class="col-code">15</td></tr>
<tr><td class="col-stt">8</td><td>Tỉnh Thái Nguyên</td><td class="col-code">19</td></tr>
<tr><td class="col-stt">9</td><td>Tỉnh Lạng Sơn</td><td class="col-code">20</td></tr>
<tr><td class="col-stt">10</td><td>Tỉnh Quảng Ninh</td><td class="col-code">22</td></tr>
<tr><td class="col-stt">11</td><td>Tỉnh Bắc Ninh</td><td class="col-code">24</td></tr>
<tr><td class="col-stt">12</td><td>Tỉnh Phú Thọ</td><td class="col-code">25</td></tr>
<tr><td class="col-stt">13</td><td>Thành phố Hải Phòng</td><td class="col-code">31</td></tr>
<tr><td class="col-stt">14</td><td>Tỉnh Hưng Yên</td><td class="col-code">33</td></tr>
<tr><td class="col-stt">15</td><td>Tỉnh Ninh Bình</td><td class="col-code">37</td></tr>
<tr><td class="col-stt">16</td><td>Tỉnh Thanh Hóa</td><td class="col-code">38</td></tr>
<tr><td class="col-stt">17</td><td>Tỉnh Nghệ An</td><td class="col-code">40</td></tr>
<tr><td class="col-stt">18</td><td>Tỉnh Hà Tĩnh</td><td class="col-code">42</td></tr>
<tr><td class="col-stt">19</td><td>Tỉnh Quảng Trị</td><td class="col-code">44</td></tr>
<tr><td class="col-stt">20</td><td>Thành phố Huế</td><td class="col-code">46</td></tr>
<tr><td class="col-stt">21</td><td>Thành phố Đà Nẵng</td><td class="col-code">48</td></tr>
<tr><td class="col-stt">22</td><td>Tỉnh Quảng Ngãi</td><td class="col-code">51</td></tr>
<tr><td class="col-stt">23</td><td>Tỉnh Gia Lai</td><td class="col-code">52</td></tr>
<tr><td class="col-stt">24</td><td>Tỉnh Khánh Hòa</td><td class="col-code">56</td></tr>
<tr><td class="col-stt">25</td><td>Tỉnh Đắk Lắk</td><td class="col-code">66</td></tr>
<tr><td class="col-stt">26</td><td>Tỉnh Lâm Đồng</td><td class="col-code">68</td></tr>
<tr><td class="col-stt">27</td><td>Tỉnh Đồng Nai</td><td class="col-code">75</td></tr>
<tr><td class="col-stt">28</td><td>Thành phố Hồ Chí Minh</td><td class="col-code">79</td></tr>
<tr><td class="col-stt">29</td><td>Tỉnh Tây Ninh</td><td class="col-code">80</td></tr>
<tr><td class="col-stt">30</td><td>Tỉnh Đồng Tháp</td><td class="col-code">82</td></tr>
<tr><td class="col-stt">31</td><td>Tỉnh Vĩnh Long</td><td class="col-code">86</td></tr>
<tr><td class="col-stt">32</td><td>Tỉnh An Giang</td><td class="col-code">91</td></tr>
<tr><td class="col-stt">33</td><td>Thành phố Cần Thơ</td><td class="col-code">92</td></tr>
<tr><td class="col-stt">34</td><td>Tỉnh Cà Mau</td><td class="col-code">96</td></tr>
<tr><td class="col-stt">35</td><td>Liên tỉnh</td><td class="col-code">00</td></tr>
</tbody>
</table>

Ghi chú: Trong quá trình thực hiện, Bảng mã này được cập nhật, điều chỉnh theo quyết định của Thủ tướng Chính phủ về ban hành Bảng danh mục và mã số các đơn vị hành chính Việt Nam.`;

replaceArticleContent('tt24-dpl1', pl1Content);

// ==============================
// PHỤ LỤC II - Dữ liệu QH đô thị/nông thôn
// ==============================
const pl2Content = \`Dữ liệu về quy hoạch đô thị và nông thôn
(Ban hành kèm theo Thông tư số 24/2025/TT-BXD ngày 29 tháng 8 năm 2025 của Bộ trưởng Bộ Xây dựng)

<table>
<thead><tr><th>STT</th><th>Thông tin về quy hoạch đô thị và nông thôn</th><th>Quy định về nhập thông tin</th></tr></thead>
<tbody>
<tr><th class="col-stt text-center align-middle">I</th><th class="text-left font-bold" style="padding-left:1rem">Thông tin chung</th><td class="col-note italic text-sm">Để khởi tạo Mã số thông tin theo quy định tại điểm a khoản 5 Điều 10 Nghị định số 111/2024/NĐ-CP</td></tr>
<tr><td class="col-stt">1</td><td>Tên quy hoạch</td><td>[Nhập thông tin]<br/><br/><i class="text-xs text-gray-500">- Cơ quan thẩm định quy hoạch phối hợp với cơ quan lập quy hoạch để cập nhật nội dung thông tin chung theo quy định tại điểm a khoản 2 Điều 6 Nghị định số 111/2024/NĐ-CP.<br/>- Dữ liệu mở bao gồm dữ liệu tại mục I và II.</i></td></tr>
<tr><td class="col-stt">2</td><td>Loại quy hoạch</td><td>[Chọn loại quy hoạch]</td></tr>
<tr><td class="col-stt">3</td><td>Cấp độ quy hoạch</td><td>[Chọn cấp độ quy hoạch]</td></tr>
<tr><td class="col-stt">4</td><td>Loại điều chỉnh quy hoạch</td><td>[Chọn loại điều chỉnh]</td></tr>
<tr><td class="col-stt">5</td><td>Địa điểm quy hoạch</td><td>[Chọn tỉnh/TP, xã/phường hoặc nhập]</td></tr>
<tr><td class="col-stt">6</td><td>Quy mô, diện tích lập quy hoạch</td><td>[Nhập thông tin (theo hecta)]</td></tr>
<tr><td class="col-stt">7</td><td>Số quyết định phê duyệt nhiệm vụ QH</td><td>[Số quyết định]</td></tr>
<tr><td class="col-stt">8</td><td>Cơ quan tổ chức lập nhiệm vụ QH</td><td>[Nhập thông tin hoặc Mã ĐKKD]</td></tr>
<tr><td class="col-stt">9</td><td>Cơ quan tổ chức lập quy hoạch</td><td>[Nhập thông tin hoặc Mã ĐKKD]</td></tr>
<tr><td class="col-stt">10</td><td>Cơ quan thẩm định quy hoạch</td><td>[Nhập thông tin]</td></tr>
<tr><td class="col-stt">11</td><td>Cơ quan phê duyệt quy hoạch</td><td>[Nhập thông tin]</td></tr>
<tr><th class="col-stt text-center align-middle">II</th><th class="text-left font-bold" style="padding-left:1rem">Thông tin chi tiết</th><td class="col-note italic text-sm">Cơ quan lập quy hoạch cập nhật thông tin chi tiết</td></tr>
<tr><td class="col-stt">1</td><td>Quy mô dân số dự báo</td><td>[Nhập thông tin]</td></tr>
<tr><td class="col-stt">2</td><td>Thời hạn quy hoạch</td><td>[Nhập thông tin]</td></tr>
<tr><td class="col-stt">3</td><td>Quy định quản lý theo quy hoạch</td><td>[Các tệp tin (file) hồ sơ được chứng thực bản sao điện tử...]</td></tr>
<tr><td class="col-stt">4</td><td>Kế hoạch thực hiện QH chung</td><td>[Tệp tin (file) có chữ ký số hoặc chứng thực bản sao điện tử...]</td></tr>
<tr><td class="col-stt">5</td><td>Quy chế quản lý kiến trúc (nếu có)</td><td>[Các tệp tin (file) hồ sơ được chứng thực bản sao điện tử...]</td></tr>
<tr><td class="col-stt" rowspan="4">6</td><td rowspan="4">Thông tin liên quan khác</td><td>6.1 Các NV QH liên quan [mã TTQH cấp trên/dưới]</td></tr>
<tr><td>6.2 Chủ nhiệm lập quy hoạch [mã số CCHN/CCCD]</td></tr>
<tr><td>6.3 Danh sách chủ trì các bộ môn thiết kế quy hoạch [mã số CCHN/CCCD]</td></tr>
<tr><td>6.4 Thông tin khác (nếu có)</td></tr>
<tr><th class="col-stt text-center align-middle">III</th><th colspan="2" class="text-left font-bold" style="padding-left:1rem">Hồ sơ nhiệm vụ quy hoạch, quy hoạch đô thị và nông thôn, thiết kế đô thị riêng chi tiết</th></tr>
<tr><td class="col-stt">1</td><td>Cơ sở dữ liệu số cơ bản</td><td>[Các tệp tin (file) bản vẽ và văn bản...]</td></tr>
<tr><td class="col-stt">2</td><td>Cơ sở dữ liệu số pháp lý</td><td>[Các tệp tin (file) được số hóa, quét (scan)...]</td></tr>
<tr><td class="col-stt">3</td><td>Cơ sở dữ liệu số địa lý (GIS)</td><td>[Các tệp tin (file) được chuyển đổi thành dữ liệu địa lý...]</td></tr>
</tbody>
</table>\`;

replaceArticleContent('tt24-dpl2', pl2Content);

// ==============================
// PHỤ LỤC III - Dữ liệu DA ĐTXD/CT XD 
// ==============================
const pl3Content = \`Dữ liệu về dự án đầu tư xây dựng, công trình xây dựng
(Ban hành kèm theo Thông tư số 24/2025/TT-BXD ngày 29/08/2025)

BẢNG SỐ 01: Dữ liệu về dự án đầu tư xây dựng, công trình xây dựng

<table>
<thead><tr><th>STT</th><th>Nội dung nhập, cập nhật dữ liệu về dự án đầu tư xây dựng, công trình xây dựng</th><th>Ghi chú quy định về nhập, cập nhật dữ liệu, dữ liệu mở</th></tr></thead>
<tbody>
<tr><th class="col-stt text-center align-middle font-bold text-lg">A</th><th class="text-left font-bold" style="padding-left:1rem">Thẩm định Báo cáo nghiên cứu khả thi đầu tư xây dựng<br/><br/><span class="text-sm font-normal italic">(Cơ quan chuyên môn về xây dựng khởi tạo mã số thông tin khi có kết quả thẩm định Báo cáo nghiên cứu khả thi đầu tư xây dựng theo quy định tại điểm a khoản 2 Điều 10 Nghị định số 111/2024/NĐ-CP)</span></th><td class="col-note text-sm"></td></tr>
<tr><th class="col-stt text-center align-middle font-bold text-lg">I</th><th class="text-left font-bold" style="padding-left:1rem">Dữ liệu chung</th><td class="col-note text-sm">Cơ quan thực hiện thủ tục hành chính theo phân cấp nhập dữ liệu chung khi khởi tạo Mã số thông tin theo quy định tại điểm a khoản 6 Điều 10 Nghị định số 111/2024/NĐ-CP</td></tr>
<tr><td class="col-stt">1</td><td>Tên dự án đầu tư xây dựng</td><td>[Nhập dữ liệu]<br/><br/><i class="text-xs text-gray-500">- Nhập nội dung dữ liệu chung về dự án đầu tư xây dựng quy định tại điểm a khoản 1 Điều 7 Nghị định số 111/2024/NĐ-CP</i></td></tr>
<tr><td class="col-stt">2</td><td>Nhóm dự án</td><td>[Chọn trong các ô: Nhóm A/B/C]</td></tr>
<tr><td class="col-stt">3</td><td>Địa điểm xây dựng</td><td>[Chọn tỉnh/thành phố, xã/phường/đặc khu]</td></tr>
<tr><td class="col-stt">4</td><td>Người quyết định đầu tư</td><td>[Nhập tên Người quyết định đầu tư]</td></tr>
<tr><td class="col-stt">5</td><td>Chủ đầu tư</td><td>[Nhập tên Chủ đầu tư]</td></tr>
<tr><td class="col-stt">6</td><td>Mục tiêu đầu tư</td><td>[Nhập dữ liệu] theo quy định pháp luật về đầu tư và pháp luật khác có liên quan</td></tr>
<tr><td class="col-stt">7</td><td>Quy mô đầu tư</td><td>[Nhập dữ liệu] <br/><br/><i class="text-xs text-gray-500">(Quy mô đầu tư xây dựng chủ yếu theo quy định pháp luật về đầu tư công, đầu tư, xây dựng, nhà ở, kinh doanh bất động sản...)</i></td></tr>
<tr><th class="col-stt text-center align-middle font-bold text-lg">II</th><th class="text-left font-bold" style="padding-left:1rem">Dữ liệu chi tiết</th><td class="col-note text-sm">Chủ đầu tư cập nhật nhập dữ liệu chi tiết quy định tại điểm b khoản 6 Điều 10 Nghị định số 111/2024/NĐ-CP</td></tr>
<tr><td class="col-stt">1</td><td>Văn bản về chủ trương đầu tư của cơ quan nhà nước có thẩm quyền</td><td>[Nhập số..., ngày..., tháng..., năm..., cơ quan ban hành văn bản]<br/><br/>[Đính kèm file được ký số hoặc được chứng thực bản sao điện tử từ bản chính]</td></tr>
<tr><td class="col-stt">2</td><td>Quyết định phê duyệt quy hoạch làm cơ sở lập dự án</td><td>[Nhập số..., ngày..., tháng..., năm..., cơ quan ban hành văn bản]</td></tr>
<tr><td class="col-stt" rowspan="2">3</td><td rowspan="2">Kết quả thực hiện thủ tục về phòng cháy chữa cháy và bảo vệ môi trường</td><td>[Đính kèm file được ký số hoặc được chứng thực bản sao điện tử từ bản chính]</td></tr>
<tr><td>[Nhập số..., ngày..., tháng..., năm..., cơ quan ban hành văn bản]</td></tr>
<tr><td class="col-stt">4</td><td>Thông báo kết quả thẩm định BCNCKT ĐTXD của cơ quan chuyên môn</td><td>[Đính kèm file được ký số hoặc được chứng thực bản sao điện tử...]</td></tr>
<tr><td class="col-stt">5</td><td>Quyết định phê duyệt dự án ĐTXD của người quyết định ĐT</td><td>[Đính kèm file]</td></tr>
<tr><td class="col-stt" rowspan="9">6</td><td rowspan="9">Dữ liệu về tổ chức, cá nhân tham gia ĐTXD theo quy định tại điểm g khoản 1 Điều 7 Nghị định số 111/2024/NĐ-CP</td><td>6.1 Nhà thầu khảo sát</td></tr>
<tr><td>6.2 Chủ nhiệm khảo sát</td></tr>
<tr><td>6.3 Nhà thầu lập thiết kế cơ sở</td></tr>
<tr><td>6.4 Chủ nhiệm thiết kế</td></tr>
<tr><td>6.5 Danh sách chủ trì bộ môn thiết kế</td></tr>
<tr><td>6.6 Nhà thầu thẩm tra thiết kế cơ sở</td></tr>
<tr><td>6.7 Chủ nhiệm thẩm tra thiết kế</td></tr>
<tr><td>6.8 Danh sách chủ trì thẩm tra các bộ môn thiết kế</td></tr>
<tr><td>6.9 Nhà thầu thẩm tra ATGT (nếu có)</td></tr>
<tr><td class="col-stt" rowspan="9">7</td><td rowspan="9">Hồ sơ văn bản liên quan được yêu cầu tùy chọn tại thời điểm ĐT</td><td>7.1 Mã quy hoạch đô thị/nông thôn</td></tr>
<tr><td>7.2 Loại dự án</td></tr>
<tr><td>7.3 Cấp công trình</td></tr>
<tr><td>7.4 Tổng mức đầu tư</td></tr>
<tr><td>7.5 Nguồn vốn</td></tr>
<tr><td>7.6 Thời gian thực hiện</td></tr>
<tr><td>7.7 Hình thức QLDA</td></tr>
<tr><td>7.8 Giải thưởng kiến trúc (nếu có)</td></tr>
<tr><td>7.9 Dữ liệu loại hình BĐS theo NĐ 111</td></tr>
<tr><td class="col-stt">8</td><td>Dữ liệu khác (nếu có)</td><td>[Nhập thông tin]</td></tr>
<tr><th class="col-stt text-center align-middle font-bold text-lg">B</th><th class="text-left font-bold" style="padding-left:1rem">Thẩm định Thiết kế xây dựng triển khai sau thiết kế cơ sở<br/><br/><span class="text-sm font-normal italic">(Cơ quan chuyên môn về xây dựng khởi tạo mã số thông tin khi có kết quả thẩm định theo quy định tại điểm a khoản 3 Điều 10 Nghị định số 111/2024/NĐ-CP)</span></th><td class="col-note text-sm">Tương tự mục A</td></tr>
<tr><th class="col-stt text-center align-middle font-bold text-lg">I</th><th class="text-left font-bold" style="padding-left:1rem">Dữ liệu chung</th><td class="col-note text-sm">Gồm Mã số dự án (nếu có), tên công trình, loại/cấp công trình, địa điểm, chủ đầu tư, quy mô</td></tr>
<tr><th class="col-stt text-center align-middle font-bold text-lg">II</th><th class="text-left font-bold" style="padding-left:1rem">Dữ liệu chi tiết</th><td class="col-note text-sm">Gồm PCCC+Môi trường, Thông báo thẩm định, Giấy tờ thẩm định, Dữ liệu tổ chức/cá nhân, văn bản liên quan...</td></tr>
<tr><th class="col-stt text-center align-middle font-bold text-lg">C</th><th class="text-left font-bold" style="padding-left:1rem">Cấp Giấy Phép Xây Dựng<br/><br/><span class="text-sm font-normal italic">(Cơ quan cấp giấy phép khởi tạo mã số thông tin khi có kết quả cấp phép theo quy định tại điểm b khoản 2 Điều 10 Nghị định số 111/2024/NĐ-CP)</span></th><td class="col-note text-sm"></td></tr>
<tr><th class="col-stt text-center align-middle font-bold text-lg">I</th><th class="text-left font-bold" style="padding-left:1rem">Dữ liệu chung</th><td class="col-note text-sm">Tên CTXD, loại/cấp CT, địa điểm, CĐT, quy mô</td></tr>
<tr><th class="col-stt text-center align-middle font-bold text-lg">II</th><th class="text-left font-bold" style="padding-left:1rem">Dữ liệu chi tiết</th><td class="col-note text-sm">Gồm GPXD, thông báo khởi công, giấy tờ đất đai, nhà thầu thi công, giám sát, an toàn lao động, kiểm định chất lượng, nhật ký, bản vẽ hoàn công thi công...</td></tr>
<tr><th class="col-stt text-center align-middle font-bold text-lg">D</th><th class="text-left font-bold" style="padding-left:1rem">Miễn Giấy Phép Xây Dựng</th><td class="col-note text-sm">Tương tự mục C (Trừ GPXD)</td></tr>
</tbody>
</table>

BẢNG SỐ 02: CT XD không yêu cầu lập DA, chỉ cấp GPXD

<table>
<thead><tr><th>Mục</th><th>Nội dung dữ liệu</th><th>Quy định nhập</th></tr></thead>
<tbody>
<tr><td class="col-stt">I</td><td>Dữ liệu chung: 5 mục</td><td>Tên CTXD, loại/cấp CT, địa điểm, CĐT/chủ hộ, quy mô</td></tr>
<tr><td class="col-stt">II</td><td>Dữ liệu chi tiết: 7 mục</td><td>GPXD, TB khởi công, giấy tờ đất đai, DL TC/CN, vi phạm HCXD, sự cố CTXD, sự cố ATLĐ</td></tr>
</tbody>
</table>

BẢNG SỐ 03: CT XD miễn TĐ tại CQCM, miễn GPXD, chỉ thông báo khởi công

<table>
<thead><tr><th>STT</th><th>Nội dung dữ liệu</th></tr></thead>
<tbody>
<tr><td class="col-stt">1</td><td>Tên hạng mục công trình</td></tr>
<tr><td class="col-stt">2</td><td>Địa điểm xây dựng</td></tr>
<tr><td class="col-stt">3</td><td>CĐT/chủ hộ gia đình</td></tr>
<tr><td class="col-stt">4</td><td>Số điện thoại liên lạc</td></tr>
<tr><td class="col-stt">5</td><td>Quy mô ĐTXD chủ yếu (diện tích, số tầng, tổng DT sàn...)</td></tr>
<tr><td class="col-stt">6</td><td>DL tổ chức/cá nhân tham gia</td></tr>
<tr><td class="col-stt">7</td><td>Ngày khởi công/hoàn thành</td></tr>
<tr><td class="col-stt">8</td><td>Vi phạm HCXD</td></tr>
<tr><td class="col-stt">9</td><td>Sự cố CTXD</td></tr>
<tr><td class="col-stt">10</td><td>Sự cố kỹ thuật ATLĐ</td></tr>
</tbody>
</table>

Ghi chú:
(*) Quy mô ĐTXD chủ yếu: theo từng lĩnh vực (dân dụng, giao thông, HTKT, phát triển đô thị, nhà ở, KDBĐS...)
(**) CĐT nhập/cập nhật trong 20 ngày làm việc, liên kết hệ thống thanh toán/quyết toán Bộ Tài chính
(***) Liên kết hệ thống xử phạt VPHC, báo cáo sự cố, lịch sử bảo trì; tự động nhập khi đủ điều kiện công nghệ\`;

replaceArticleContent('tt24-dpl3', pl3Content);

// ==============================
// PHỤ LỤC IV - Bảng tổng hợp
// ==============================
const pl4Content = `Các bảng tổng hợp dữ liệu, thông tin về hoạt động xây dựng
(Ban hành kèm theo Thông tư số 24/2025/TT-BXD ngày 29/08/2025)
(*) Thông tin có thể trích xuất theo yêu cầu đột xuất, hàng tháng, hàng quý, hàng năm.

<table>
<thead><tr><th>Bảng số</th><th>Tên bảng tổng hợp</th><th>Nội dung chính</th></tr></thead>
<tbody>
<tr><td class="col-stt">01</td><td>TH thông tin QH đô thị và nông thôn</td><td>Theo tỉnh/TP: QH đô thị (chung/phân khu/chi tiết), QH nông thôn (chung/chi tiết), QH khu chức năng, QH chuyên ngành HTKT, QH không gian ngầm</td></tr>
<tr><td class="col-stt">02</td><td>TH tỷ lệ lập QH, QCQLKT</td><td>Theo tỉnh/TP: Tỷ lệ lập QH chung (SL/KH, DT), tỷ lệ lập QHPK, QHCT, QCQLKT</td></tr>
<tr><td class="col-stt">03</td><td>TH DA ĐTXD vốn ĐTC/NN ngoài ĐTC/PPP/vốn khác</td><td>Theo xã/tỉnh/Bộ: Tổng số BCNCKT đã TĐ, TMĐT phê duyệt, TKXD đã TĐ, DT XD phê duyệt, giá trị QT</td></tr>
<tr><td class="col-stt">04</td><td>TH GPXD, khởi công, sự cố, vi phạm, nghiệm thu</td><td>Theo xã/tỉnh: GPXD cấp, CT khởi công, sự cố CTXD/ATLĐ, vi phạm TTXD, CT nghiệm thu. Chi tiết theo loại: dân dụng/CN/HTKT/GT/NN-PTNT/nhà ở riêng lẻ</td></tr>
<tr><td class="col-stt">05</td><td>TH năng lực hoạt động XD nhà thầu</td><td>Theo tỉnh/TP: SL TC khảo sát (nhóm A/B/C), TK QH, thẩm tra ATGT, TK/thẩm tra TK XD (cấp I/II/III), TVQLDA, thi công, TV giám sát</td></tr>
<tr><td class="col-stt">06</td><td>TH năng lực hành nghề XD cá nhân</td><td>Theo tỉnh/TP: SL CCHN theo lĩnh vực (KS, TK QH, TK XD, GS, ĐG, QLDA) và hạng (I/II/III)</td></tr>
<tr><td class="col-stt">07</td><td>TH lịch sử hoạt động nhà thầu</td><td>Mã DN, DA/CT đã thực hiện, giải thưởng, sự cố, vi phạm, tài chính (DT 3 năm, tổng TS, LN, dư nợ). Xếp hạng theo: quy mô, giải thưởng, sự cố, tài chính</td></tr>
<tr><td class="col-stt">08</td><td>Tình hình DA ĐTXD vốn ĐTC/NN ngoài ĐTC/PPP (từng DA)</td><td>Tiến độ, tỷ lệ KL hoàn thành, giải ngân theo KH vốn/HĐ, sự cố, vi phạm, cảnh báo chậm, vướng mắc</td></tr>
<tr><td class="col-stt">09</td><td>TH DA ĐTXD vốn ĐTC/NN ngoài ĐTC/PPP (tổng hợp)</td><td>Theo xã/tỉnh/Bộ/toàn quốc: Tổng số DA, tỷ lệ KL, giải ngân, sự cố, cảnh báo, vướng mắc (AI tổng hợp, phân loại)</td></tr>
<tr><td class="col-stt">10</td><td>Tình hình DA ĐTXD vốn khác (từng DA)</td><td>Tiến độ, tỷ lệ KL HT, sự cố, vi phạm, cảnh báo, vướng mắc</td></tr>
<tr><td class="col-stt">11</td><td>TH DA ĐTXD vốn khác (tổng hợp)</td><td>Theo xã/tỉnh/toàn quốc</td></tr>
<tr><td class="col-stt">12</td><td>TH CT XD không lập DA, chỉ cấp GPXD</td><td>Theo xã/tỉnh: Tổng CT, tổng DT sàn, sự cố, vi phạm</td></tr>
<tr><td class="col-stt">13</td><td>TH CT XD miễn TĐ, miễn GPXD</td><td>Theo xã/tỉnh: Tổng CT, tổng DT sàn, sự cố, vi phạm</td></tr>
<tr><td class="col-stt">14</td><td>TH theo địa phương về CT khởi công/thi công/HT/KT CL</td><td>CT mới khởi công (DD/CN/GT/HTKT), CT đang thi công, CT hoàn thành, CT kiểm tra CL (đạt/không đạt)</td></tr>
<tr><td class="col-stt">15</td><td>Ví dụ minh họa</td><td>VD1: Tổng vốn ĐTXD toàn quốc. VD2: Phân bố loại CT. VD3: Tình hình triển khai ĐTXD. VD4: Vi phạm TTXD (dự báo giảm). VD5: Suất vốn ĐTXD thực tế</td></tr>
</tbody>
</table>`;

replaceArticleContent('tt24-dpl4', pl4Content);

// ==============================
// PHỤ LỤC V - Biểu mẫu DL mở
// ==============================
const pl5Content = `Biểu mẫu cung cấp thông tin về dữ liệu mở trong hệ thống thông tin, CSDL quốc gia về HĐXD
(Ban hành kèm theo Thông tư số 24/2025/TT-BXD ngày 29/08/2025)

<table>
<thead><tr><th>Bảng số</th><th>Tên biểu mẫu</th><th>Nội dung dữ liệu mở</th></tr></thead>
<tbody>
<tr><td class="col-stt">01</td><td>DL mở QH đô thị và nông thôn</td><td>17 mục: Tên QH (kèm Mã TTQH), loại QH, cấp độ QH, loại điều chỉnh, địa điểm, quy mô DT, QĐ phê duyệt NV, CQ lập NV, CQ lập QH, CQ thẩm định, CQ phê duyệt, dân số dự báo, thời hạn, QĐ QL theo QH, KH thực hiện QHC, QCQLKT</td></tr>
<tr><td class="col-stt">02</td><td>DL mở DA ĐTXD/CTXD</td><td>I. TĐ BCNCKT (9 mục): tên DA+mã, nhóm, địa điểm, người QĐ ĐT, CĐT, mục tiêu, quy mô, TB TĐ, QĐ PD<br/>II. TĐ TKXD (11 mục): mã DA, tên CT+mã, loại/cấp CT, địa điểm, CĐT, quy mô, TB TĐ BCNCKT/TKXD, QĐ PD DA/TKXD<br/>III. GPXD (7 mục): tên CT+mã, loại/cấp, địa điểm, CĐT, quy mô, GPXD, TB khởi công</td></tr>
<tr><td class="col-stt">03</td><td>DL mở CT XD không lập DA, chỉ cấp GPXD</td><td>7 mục: Tên CTXD, loại/cấp CT, địa điểm, chủ hộ, quy mô, GPXD, TB khởi công</td></tr>
<tr><td class="col-stt">04</td><td>DL mở CT XD miễn TĐ/GPXD</td><td>4 mục: Tên hạng mục CT, địa điểm, CĐT/chủ hộ, quy mô ĐTXD chủ yếu</td></tr>
<tr><td class="col-stt">05</td><td>DL mở năng lực nhà thầu</td><td>Thông tin NL (5 mục): Tên NT, quy mô DA (nhóm A/B/C, cấp ĐB/I/II/III), giải thưởng, sự cố, vi phạm<br/>DS nhà thầu theo lĩnh vực (TK XD/thi công/...)<br/>Bảng xếp hạng: (1) quy mô DA, (2) giải thưởng, (3) sự cố/vi phạm, (4) tài chính<br/>Tra cứu theo mã số DN, tạo hồ sơ NL trên CSDLQG</td></tr>
<tr><td class="col-stt">06</td><td>DL mở năng lực cá nhân hành nghề</td><td>Theo lĩnh vực (KS, TK QH, TK XD, GS, ĐG, QLDA, CHT, KĐ...): Họ tên, mã CCHN, tỉnh/TP, SL/quy mô DA đã thực hiện<br/>Tra cứu theo số ĐDCN, tạo hồ sơ NL hành nghề</td></tr>
</tbody>
</table>`;

replaceArticleContent('tt24-dpl5', pl5Content);

// ==============================
// PHỤ LỤC VI - Mẫu phiếu
// ==============================
const pl6Content = `Các mẫu phiếu đề nghị cung cấp, khai thác thông tin và mẫu phiếu cung cấp thông tin HĐXD
(Ban hành kèm theo Thông tư số 24/2025/TT-BXD ngày 29/08/2025)
(*) Thông tin được cung cấp theo lộ trình nhập, cập nhật DL và công bố dịch vụ chia sẻ DL.

<table>
<thead><tr><th>Mẫu số</th><th>Tên mẫu phiếu</th><th>Nội dung chính</th></tr></thead>
<tbody>
<tr><td class="col-stt">01</td><td>Phiếu đề nghị cung cấp TT QH đô thị và nông thôn</td><td>Kính gửi: Cục KT-QLĐTXD. Nội dung: I. TT TC/CN (họ tên, CCCD, cư trú), II. Người đại diện, III. Phạm vi chỉ tiêu QH-KT tại vị trí (liên kết DL QH + đất đai), mục đích khai thác</td></tr>
<tr><td class="col-stt">02</td><td>Phiếu cung cấp TT QH phục vụ ĐTXD công trình</td><td>CQ cung cấp: Phòng/Đơn vị thuộc Cục KT-QLĐTXD<br/>11 chỉ tiêu QH-KT: (1) Vị trí (tọa độ, mã TTQH, GIS), (2) DT lô đất, (3) Mục đích SDĐ, (4) Tầng cao, (5) Chiều cao tối đa/tối thiểu, (6) Cốt XD, (7) Khoảng lùi, (8) Mật độ XD, (9) Hệ số SDĐ, (10) Hình khối/màu sắc/KT chủ đạo, (11) Giới hạn tầng 1, ban công, lô gia, mái</td></tr>
<tr><td class="col-stt">03</td><td>Phiếu đề nghị cung cấp TT DA, CT XD</td><td>Nội dung chọn: Mục đích SDĐ, tiến độ theo chủ trương ĐT, tiến độ thực tế, giấy tờ đất đai, loại hình CT, quy mô ĐTXD, tài liệu pháp lý, DS nhà thầu, sự cố, bảo hành bảo trì</td></tr>
<tr><td class="col-stt">04</td><td>Phiếu cung cấp TT DA, CT XD</td><td>12 mục: Tên DA/CT (kèm mã), vị trí, mục đích đất, tiến độ chủ trương, tiến độ thực tế (GPXD/khởi công/nghiệm thu/ĐK kinh doanh BĐS), giấy tờ đất đai, loại hình, quy mô, tài liệu PL, DS nhà thầu, sự cố, bảo hành bảo trì</td></tr>
<tr><td class="col-stt">05</td><td>Phiếu đề nghị khai thác TT HĐĐTXD</td><td>Khai thác DL tại Phụ lục IV, tạo lập thông tin thị trường ĐTXD trên nền tảng CSDLQG</td></tr>
<tr><td class="col-stt">06</td><td>Phiếu cung cấp TT HĐĐTXD</td><td>Cung cấp tương ứng theo Phụ lục IV</td></tr>
<tr><td class="col-stt">07</td><td>Phiếu đề nghị khai thác TT năng lực NT</td><td>Khai thác DL lịch sử HĐXD nhà thầu, tạo lập hồ sơ NL trên CSDLQG</td></tr>
<tr><td class="col-stt">08</td><td>Phiếu cung cấp TT năng lực NT</td><td>Cung cấp DL lịch sử + hồ sơ năng lực nhà thầu</td></tr>
</tbody>
</table>`;

replaceArticleContent('tt24-dpl6', pl6Content);

// ==============================
// PHỤ LỤC VII - Ví dụ minh họa mã số
// ==============================
const pl7Content = `Ví dụ minh họa về mã số dữ liệu QH đô thị và nông thôn, dự án đầu tư xây dựng
(Ban hành kèm theo Thông tư số 24/2025/TT-BXD ngày 29/08/2025)

VÍ DỤ 1: MÃ SỐ DỮ LIỆU QUY HOẠCH ĐÔ THỊ VÀ NÔNG THÔN (12 ký tự)

<table>
<thead><tr><th>Vị trí</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th></tr></thead>
<tbody>
<tr><td><strong>Mã số</strong></td><td class="col-code">0</td><td class="col-code">1</td><td class="col-code">2</td><td class="col-code">6</td><td class="col-code">1</td><td class="col-code">1</td><td class="col-code">0</td><td class="col-code">8</td><td class="col-code">8</td><td class="col-code">8</td><td class="col-code">8</td><td class="col-code">8</td></tr>
</tbody>
</table>

<table>
<thead><tr><th>Ký tự</th><th>Ý nghĩa</th><th>Giá trị</th><th>Diễn giải</th></tr></thead>
<tbody>
<tr><td class="col-code">1-2</td><td>Mã tỉnh/TP trực thuộc TW</td><td class="col-code">01</td><td>Hà Nội</td></tr>
<tr><td class="col-code">3-4</td><td>Năm trình phê duyệt QH</td><td class="col-code">26</td><td>Năm 2026</td></tr>
<tr><td class="col-code">5</td><td>Cấp độ QH</td><td class="col-code">1</td><td>QH chung</td></tr>
<tr><td class="col-code">6</td><td>Loại QH</td><td class="col-code">1</td><td>QH đô thị</td></tr>
<tr><td class="col-code">7</td><td>Loại điều chỉnh QH</td><td class="col-code">0</td><td>Lập lần đầu hoặc lập mới</td></tr>
<tr><td class="col-code">8-12</td><td>Dãy số ngẫu nhiên</td><td class="col-code">88888</td><td>Số ngẫu nhiên</td></tr>
</tbody>
</table>

→ Mã số 012611088888: Quy hoạch chung Hà Nội được lập mới, trình phê duyệt năm 2026

VÍ DỤ 2: MÃ SỐ DỮ LIỆU DỰ ÁN ĐẦU TƯ XÂY DỰNG (13 ký tự)

<table>
<thead><tr><th>Vị trí</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th><th>13</th></tr></thead>
<tbody>
<tr><td><strong>Mã số</strong></td><td class="col-code">2</td><td class="col-code">5</td><td class="col-code">2</td><td class="col-code">8</td><td class="col-code">1</td><td class="col-code">1</td><td class="col-code">0</td><td class="col-code">0</td><td class="col-code">1</td><td class="col-code">6</td><td class="col-code">8</td><td class="col-code">0</td><td class="col-code">3</td></tr>
</tbody>
</table>

<table>
<thead><tr><th>Ký tự</th><th>Ý nghĩa</th><th>Giá trị</th><th>Diễn giải</th></tr></thead>
<tbody>
<tr><td class="col-code">1-2</td><td>Mã tỉnh/TP</td><td class="col-code">25</td><td>Phú Thọ</td></tr>
<tr><td class="col-code">3-4</td><td>Năm DA được thẩm định</td><td class="col-code">28</td><td>Năm 2028</td></tr>
<tr><td class="col-code">5</td><td>Loại DA</td><td class="col-code">1</td><td>DA ĐTXD công trình dân dụng</td></tr>
<tr><td class="col-code">6</td><td>Trình tự thủ tục</td><td class="col-code">1</td><td>DA có yêu cầu TĐ tại CQCM về XD</td></tr>
<tr><td class="col-code">7-11</td><td>Dãy số ngẫu nhiên</td><td class="col-code">00168</td><td>Số ngẫu nhiên</td></tr>
<tr><td class="col-code">12-13</td><td>Số lần điều chỉnh</td><td class="col-code">03</td><td>Điều chỉnh lần 03</td></tr>
</tbody>
</table>

→ Mã số 2528110016803: DA ĐTXD công trình dân dụng tại Phú Thọ, năm 2028, đã TĐ tại CQCM về XD, điều chỉnh 03 lần`;

replaceArticleContent('tt24-dpl7', pl7Content);

// Save
fs.writeFileSync(legalDataPath, data, 'utf-8');
console.log('\n✅ All 7 Phụ lục updated with HTML tables!');
console.log('File size:', (fs.statSync(legalDataPath).size / 1024).toFixed(1), 'KB');
