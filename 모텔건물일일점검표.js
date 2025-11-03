document.addEventListener("DOMContentLoaded", () => {
	const today = new Date().toISOString().slice(0, 10);
	document.getElementById("date").value = today;

	// ✅ PC / 모바일 구분 후 capture 속성 자동 설정
	const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
	const fileInputs = document.querySelectorAll(
		'input[type="file"][accept="image/*"]',
	);
	fileInputs.forEach((input) => {
		if (isMobile) {
			input.setAttribute("capture", "camera"); // 📱 카메라 바로 실행
		} else {
			input.removeAttribute("capture"); // 💻 PC는 파일 선택창
		}
	});
});

// ✅ AI 이미지 분석 기능
async function analyzeImage(input) {
	const file = input.files[0];
	if (!file) return;

	const parentTd = input.closest("td");
	parentTd.style.opacity = "0.5";
	parentTd.style.pointerEvents = "none";
	const loadingMsg = document.createElement("div");
	loadingMsg.innerText = "🔍 AI 분석 중...";
	loadingMsg.style.color = "#2f54eb";
	loadingMsg.style.fontSize = "0.85em";
	parentTd.appendChild(loadingMsg);

	const reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = async () => {
		const base64Image = reader.result;
		try {
			const response = await fetch("https://api.openai.com/v1/responses", {
				method: "POST",
				headers: {
					Authorization: "Bearer YOUR_API_KEY",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: "gpt-4o-mini",
					input: [
						{
							role: "user",
							content: [
								{
									type: "input_text",
									text: "이 사진에서 시설에 이상(파손, 누수, 오염, 조명 불량 등)이 있는지 간단히 판단해줘. 이상이 없으면 '정상', 있으면 '이상'이라고만 말해.",
								},
								{ type: "input_image", image_url: base64Image },
							],
						},
					],
				}),
			});

			const result = await response.json();
			const output = result.output?.[0]?.content?.[0]?.text || "결과 없음";

			// 결과 표시 및 자동선택
			if (output.includes("이상")) {
				const abnormal = parentTd.querySelector('input[value="이상"]');
				if (abnormal) abnormal.checked = true;
			} else {
				const normal = parentTd.querySelector('input[value="정상"]');
				if (normal) normal.checked = true;
			}

			loadingMsg.innerText = "✅ 분석 완료: " + output;
		} catch (err) {
			loadingMsg.innerText = "❌ 분석 실패";
			console.error(err);
		} finally {
			parentTd.style.opacity = "1";
			parentTd.style.pointerEvents = "auto";
		}
	};
}
