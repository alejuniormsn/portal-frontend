import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { keepDate } from "../../../shared/utils/workingWithDates";

function MaintenanceListPDF(completedList) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

  const reportTitle = [
    {
      text: "Listagem da Manutenção",
      fontSize: 15,
      bold: true,
      margin: [15, 20, 15, 20], // left, top, right, bottom
    },
  ];

  const dados = completedList.map((e) => {
    return [
      { text: e.car, fontSize: 7, margin: [0, 2, -1, 2] },
      { text: keepDate(e.date_maintenance), fontSize: 7, margin: [0, 2, 0, 2] },
      { text: e.types[0].name, fontSize: 7, margin: [0, 2, 0, 2] },
      { text: e.details[0].name, fontSize: 7, margin: [0, 2, 0, 2] },
      { text: e.registration_source, fontSize: 7, margin: [0, 2, 0, 2] },
      { text: e.status[0].name, fontSize: 7, margin: [0, 2, 0, 2] },
      { text: e.comments, fontSize: 7, margin: [0, 2, 0, 2] },
    ];
  });

  const details = [
    {
      table: {
        headerRows: 1,
        widths: ["*", "*", "*", "*", "*", "*", "*", "*"],
        body: [
          [
            { text: "Veículo", style: "tableHeader", fontSize: 7 },
            { text: "Data", style: "tableHeader", fontSize: 7 },
            {
              text: "Pedido de Manutenção ",
              style: "tableHeader",
              fontSize: 7,
            },
            {
              text: "Detalhamento do Pedido",
              style: "tableHeader",
              fontSize: 7,
            },
            {
              text: "Lançado por",
              style: "tableHeader",
              fontSize: 7,
            },
            { text: "Status", style: "tableHeader", fontSize: 7 },
            { text: "Comentário", style: "tableHeader", fontSize: 7 },
          ],
          ...dados,
        ],
      },
      layout: "headerLineOnly",
    },
  ];

  function footer(currentPage, pageCount) {
    return [
      {
        text: `Página ${currentPage} / ${pageCount}`,
        alignment: "right",
        fontSize: 10,
        margin: [0, 10, 20, 0], // left, top, right, bottom
      },
    ];
  }

  const docDefinitions = {
    pageSize: "A4",
    pageMargins: [15, 50, 15, 40],
    header: [reportTitle],
    content: [details],
    footer: footer,
  };

  pdfMake.createPdf(docDefinitions).download();
}

export default MaintenanceListPDF;
