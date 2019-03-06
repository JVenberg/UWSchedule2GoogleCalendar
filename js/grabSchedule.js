console.log(WSData.course_data_for_term(VisualScheduleCard.term));
window.postMessage({ type: "FROM_PAGE", schedule: JSON.stringify(WSData.course_data_for_term(VisualScheduleCard.term))}, "*");
