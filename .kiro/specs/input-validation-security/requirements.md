# Tài liệu Yêu cầu

## Giới thiệu

Tính năng này bổ sung các biện pháp xác thực đầu vào và bảo mật toàn diện cho Dịch vụ Proxy Antigravity sang OpenAI API. Mục tiêu là bảo vệ dịch vụ khỏi các yêu cầu không đúng định dạng, tấn công injection và lạm dụng, đồng thời cung cấp thông báo lỗi rõ ràng cho người dùng API.

## Bảng thuật ngữ

- **Validator**: Thành phần chịu trách nhiệm xác thực các yêu cầu API đến theo các schema và quy tắc đã định nghĩa
- **Sanitizer**: Thành phần chịu trách nhiệm làm sạch và chuẩn hóa dữ liệu đầu vào để ngăn chặn tấn công injection
- **Rate_Limiter**: Thành phần chịu trách nhiệm giới hạn số lượng yêu cầu cho mỗi API key trong một khoảng thời gian
- **Request_Schema**: Định nghĩa JSON Schema mô tả cấu trúc và ràng buộc mong đợi của các yêu cầu API
- **API_Key**: Token xác thực được sử dụng để nhận dạng và ủy quyền người dùng API

## Yêu cầu

### Yêu cầu 1: Xác thực Body Request

**User Story:** Là người dùng API, tôi muốn nhận được thông báo lỗi rõ ràng khi body request của tôi không đúng định dạng, để tôi có thể nhanh chóng sửa các vấn đề trong tích hợp của mình.

#### Tiêu chí chấp nhận

1. KHI một request được nhận với body JSON không hợp lệ, Validator SẼ trả về mã trạng thái 400 với thông báo lỗi mô tả
2. KHI một request thiếu các trường bắt buộc (model, messages), Validator SẼ trả về mã trạng thái 400 liệt kê các trường thiếu
3. KHI một request chứa các trường với kiểu dữ liệu không đúng, Validator SẼ trả về mã trạng thái 400 chỉ định trường và kiểu mong đợi
4. KHI một request chứa các trường không xác định, Validator SẼ bỏ qua chúng và xử lý các trường hợp lệ

### Yêu cầu 2: Xác thực Tên Model

**User Story:** Là người dùng API, tôi muốn biết ngay lập tức nếu tôi chỉ định tên model không hợp lệ, để tôi có thể sửa request mà không cần chờ lỗi từ upstream.

#### Tiêu chí chấp nhận

1. KHI một request chỉ định tên model rỗng hoặc chỉ có khoảng trắng, Validator SẼ trả về mã trạng thái 400 với thông báo lỗi
2. KHI một request chỉ định tên model vượt quá 100 ký tự, Validator SẼ trả về mã trạng thái 400 với thông báo lỗi
3. KHI một request chỉ định tên model chứa ký tự không hợp lệ, Validator SẼ trả về mã trạng thái 400 với thông báo lỗi
4. Validator SẼ chấp nhận tên model chứa ký tự chữ và số, dấu gạch ngang, dấu gạch dưới, dấu chấm và dấu hai chấm

### Yêu cầu 3: Xác thực Phạm vi Tham số

**User Story:** Là người dùng API, tôi muốn các giá trị tham số được xác thực theo phạm vi chấp nhận được, để tôi tránh hành vi không mong đợi từ các giá trị ngoài phạm vi.

#### Tiêu chí chấp nhận

1. KHI temperature được cung cấp ngoài phạm vi 0.0 đến 2.0, Validator SẼ trả về mã trạng thái 400 với phạm vi hợp lệ
2. KHI top_p được cung cấp ngoài phạm vi 0.0 đến 1.0, Validator SẼ trả về mã trạng thái 400 với phạm vi hợp lệ
3. KHI top_k được cung cấp không phải là số nguyên dương, Validator SẼ trả về mã trạng thái 400 với phạm vi hợp lệ
4. KHI max_tokens được cung cấp ngoài phạm vi 1 đến 1000000, Validator SẼ trả về mã trạng thái 400 với phạm vi hợp lệ
5. KHI thinking_budget được cung cấp và không phải 0 hoặc trong phạm vi 1024 đến 32000, Validator SẼ trả về mã trạng thái 400 với phạm vi hợp lệ
6. KHI reasoning_effort được cung cấp với giá trị khác low, medium, hoặc high, Validator SẼ trả về mã trạng thái 400 liệt kê các giá trị hợp lệ

### Yêu cầu 4: Xác thực Mảng Messages

**User Story:** Là người dùng API, tôi muốn mảng messages của tôi được xác thực về cấu trúc và nội dung, để tôi có thể đảm bảo lịch sử hội thoại được định dạng đúng.

#### Tiêu chí chấp nhận

1. KHI mảng messages rỗng, Validator SẼ trả về mã trạng thái 400 chỉ ra rằng cần ít nhất một message
2. KHI một đối tượng message thiếu trường role, Validator SẼ trả về mã trạng thái 400 chỉ định chỉ số và trường thiếu
3. KHI role của message không phải là một trong system, user, assistant, hoặc tool, Validator SẼ trả về mã trạng thái 400 liệt kê các role hợp lệ
4. KHI content của message không phải là chuỗi hoặc mảng content hợp lệ, Validator SẼ trả về mã trạng thái 400 với định dạng mong đợi
5. KHI một item trong mảng content có trường type không hợp lệ, Validator SẼ trả về mã trạng thái 400 liệt kê các loại content hợp lệ

### Yêu cầu 5: Xác thực Định nghĩa Tool

**User Story:** Là người dùng API, tôi muốn các định nghĩa tool của tôi được xác thực, để tôi có thể đảm bảo function calling hoạt động chính xác.

#### Tiêu chí chấp nhận

1. KHI một đối tượng tool thiếu trường type, Validator SẼ trả về mã trạng thái 400 chỉ định trường thiếu
2. KHI type của tool không phải là function, Validator SẼ trả về mã trạng thái 400 chỉ ra rằng chỉ hỗ trợ loại function
3. KHI định nghĩa function thiếu trường name, Validator SẼ trả về mã trạng thái 400 chỉ định trường thiếu
4. KHI tên function chứa ký tự không hợp lệ, Validator SẼ trả về mã trạng thái 400 với yêu cầu ký tự hợp lệ
5. KHI schema parameters của function được cung cấp nhưng không hợp lệ, Validator SẼ trả về mã trạng thái 400 với yêu cầu schema

### Yêu cầu 6: Làm sạch Nội dung

**User Story:** Là người vận hành dịch vụ, tôi muốn nội dung request được làm sạch, để dịch vụ được bảo vệ khỏi các cuộc tấn công injection.

#### Tiêu chí chấp nhận

1. Sanitizer SẼ loại bỏ hoặc escape các ký tự điều khiển từ đầu vào chuỗi
2. Sanitizer SẼ giới hạn độ dài trường chuỗi để ngăn chặn cạn kiệt bộ nhớ
3. Sanitizer SẼ giới hạn kích thước mảng để ngăn chặn từ chối dịch vụ
4. Sanitizer SẼ giới hạn độ sâu lồng nhau của đối tượng để ngăn chặn tràn stack
5. KHI việc làm sạch sửa đổi nội dung, Sanitizer SẼ ghi log sửa đổi cho mục đích kiểm toán

### Yêu cầu 7: Giới hạn Tốc độ

**User Story:** Là người vận hành dịch vụ, tôi muốn giới hạn tốc độ request cho mỗi API key, để dịch vụ vẫn khả dụng cho tất cả người dùng.

#### Tiêu chí chấp nhận

1. Rate_Limiter SẼ theo dõi số lượng request cho mỗi API key trong một khoảng thời gian có thể cấu hình
2. KHI một request vượt quá giới hạn tốc độ, Rate_Limiter SẼ trả về mã trạng thái 429 với header Retry-After
3. Rate_Limiter SẼ bao gồm các header giới hạn tốc độ (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) trong các response
4. Rate_Limiter SẼ hỗ trợ giới hạn có thể cấu hình cho mỗi API key hoặc toàn cục
5. KHI giới hạn tốc độ bị vô hiệu hóa trong cấu hình, Rate_Limiter SẼ cho phép tất cả các request

### Yêu cầu 8: Giới hạn Kích thước Request

**User Story:** Là người vận hành dịch vụ, tôi muốn thực thi giới hạn kích thước request, để dịch vụ được bảo vệ khỏi các payload quá lớn.

#### Tiêu chí chấp nhận

1. KHI body request vượt quá kích thước tối đa được cấu hình, Validator SẼ trả về mã trạng thái 413 trước khi phân tích
2. KHI tổng kích thước của tất cả messages vượt quá giới hạn có thể cấu hình, Validator SẼ trả về mã trạng thái 400 với giới hạn
3. KHI nội dung của một message đơn lẻ vượt quá giới hạn có thể cấu hình, Validator SẼ trả về mã trạng thái 400 với giới hạn
4. Validator SẼ tính dữ liệu hình ảnh Base64 vào giới hạn kích thước

### Yêu cầu 9: Định dạng Response Lỗi

**User Story:** Là người dùng API, tôi muốn các lỗi xác thực tuân theo định dạng lỗi OpenAI, để mã xử lý lỗi của tôi hoạt động nhất quán.

#### Tiêu chí chấp nhận

1. Validator SẼ trả về lỗi theo định dạng tương thích OpenAI với các trường error.message, error.type, và error.code
2. Validator SẼ sử dụng type validation_error cho tất cả các lỗi xác thực
3. Validator SẼ bao gồm đường dẫn trường cụ thể trong thông báo lỗi khi có thể áp dụng
4. Validator SẼ trả về một lỗi tổng hợp duy nhất cho nhiều lỗi xác thực
