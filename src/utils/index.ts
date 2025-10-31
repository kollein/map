export function removeVietnameseTones(str: string): string {
  return (
    str
      // Chuẩn hóa Unicode để tách dấu ra khỏi ký tự
      .normalize('NFD')
      // Loại bỏ các dấu thanh (dấu sắc, huyền, hỏi, ngã, nặng)
      .replace(/[\u0300-\u036f]/g, '')
      // Chuyển đ/Đ thành d/D
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      // Loại bỏ ký tự không phải chữ cái hoặc số (ví dụ: dấu -, _, ...)
      .replace(/[^a-zA-Z0-9\s]/g, '')
      // Loại bỏ khoảng trắng thừa
      .replace(/\s+/g, '')
      // Chuyển về chữ thường
      .toLowerCase()
  )
}

export function getProvinceVietnameseName(provinceLatin: string) {
  const mapping: { [key: string]: string } = {
    angiang: 'An Giang',
    baclieu: 'Bạc Liêu',
    bentre: 'Bến Tre',
    camau: 'Cà Mau',
    cantho: 'Cần Thơ',
    dongthap: 'Đồng Tháp',
    hauchiang: 'Hậu Giang',
    kiengiang: 'Kiên Giang',
    longan: 'Long An',
    soctrang: 'Sóc Trăng',
    tiengiang: 'Tiền Giang',
    travinh: 'Trà Vinh',
    vinhlong: 'Vĩnh Long',
  }
  const province = mapping[provinceLatin]
  if (province) {
    return { provinceNoSpaces: province.replace(/(\s+)/g, '-'), province }
  }

  return null
}
