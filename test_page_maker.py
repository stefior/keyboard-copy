import random
import string


def generate_random_text(length):
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


def generate_html():
    html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keyboard Copy Extension Test Page</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.2; padding: 10px; margin: 0; }}
        h1 {{ font-size: 18px; margin-bottom: 10px; }}
        h1, h2 {{ color: #333; }}
        .section {{ margin-bottom: 10px; padding: 20px; border: 1px solid #ccc; }}
        .hidden {{ display: none; }}
        .invisible {{ visibility: hidden; }}
        .transparent {{ opacity: 0; }}
        .overflow-container {{ width: 300px; height: 100px; overflow: auto; border: 1px solid #999; }}
        .nested {{ margin-left: 20px; }}
        table {{ table-layout: fixed; border-collapse: collapse; width: 100%; }}
        td {{ border: 1px solid #ccc; padding: 2px; font-size: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
        .visually-hidden {{ position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }}
    </style>
</head>
<body>
    <h1>Keyboard Copy Extension Test Page</h1>

    <div class="section">
        <h2>1. Multiple Text Boxes (1000+ Unique Cells)</h2>
        <table>
            {text_boxes}
        </table>
    </div>

    <div class="section">
        <h2>2. Line Break Test</h2>
        <p>
            This is a paragraph<br>
            &nbsp;&nbsp;&nbsp;&nbsp;with line breaks<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;and indentation<br>
            to test &lt;br&gt; handling.
        </p>
    </div>

    <div class="section">
        <h2>3. Hidden Elements</h2>
        <p>Visible paragraph</p>
        <p class="hidden">Hidden paragraph (display: none)</p>
        <p class="invisible">Invisible paragraph (visibility: hidden)</p>
        <p class="transparent">Transparent paragraph (opacity: 0)</p>
        <p style="font-size: 0;">Zero font size paragraph</p>
        <p><span class="visually-hidden">.visually-hidden span</span></p>
        <div id="group-of-hidden-elements">
          <p class="hidden" style="display: none;">This paragraph is hidden with display: none;</p>
          <p style="visibility: hidden;">This paragraph is hidden with visibility: hidden;</p>
          <p style="opacity: 0;">This paragraph is hidden with opacity: 0;</p>
        </div>
        <p style="height: 0; overflow: hidden;">This paragraph has height: 0</p>
        <p style="width: 0; overflow: hidden;">This paragraph has width: 0</p>
        <p style="height: 0; width: 0; overflow: hidden;">This paragraph has both height: 0 and width: 0</p>
    </div>

    <div class="section">
        <h2>4. Overflow Test</h2>
        <div class="overflow-container">
            <p>This is some text inside an overflow container.</p>
            <p>You may need to scroll to see this text.</p>
            <p>This tests handling of overflow: auto/scroll.</p>
        </div>
    </div>

    <div class="section">
        <h2>5. Nested Elements</h2>
        <div>
            <p>Parent paragraph</p>
            <div class="nested">
                <p>Child paragraph 1</p>
                <p>Child paragraph 2</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>6. Mixed Content</h2>
        <p>This section has <strong>mixed</strong> <em>content</em> with <a href="#">links</a> and <span style="color: red;">colored text</span>.</p>
    </div>

    <div class="section">
        <h2>7. Empty Elements</h2>
        <p></p>
        <div></div>
        <span></span>
    </div>

    <div class="section">
        <h2>8. Pseudo Elements</h2>
        <style>
            .pseudo-before::before {{
                content: "Before content. ";
                color: blue;
            }}
            .pseudo-after::after {{
                content: " After content.";
                color: green;
            }}
            .pseudo-both::before {{
                content: "Both before. ";
                color: red;
            }}
            .pseudo-both::after {{
                content: " Both after.";
                color: purple;
            }}
        </style>
        <p class="pseudo-before">This paragraph has a pseudo ::before element.</p>
        <p class="pseudo-after">This paragraph has a pseudo ::after element.</p>
        <p class="pseudo-both">This paragraph has both ::before and ::after pseudo elements.</p>
    </div>

    <div class="section">
        <h2>9. Sibling Elements with Same Text</h2>
        <div>
            <p>Duplicate text</p>
            <p>Duplicate text</p>
            <p>Duplicate text</p>
        </div>
        <div>
            <span>Another duplicate</span>
            <span>Another duplicate</span>
        </div>
    </div>

    <div class="section">
        <h2>10. Text Alignment</h2>
        <p style="text-align: left;">Left-aligned text</p>
        <p style="text-align: center;">Center-aligned text</p>
        <p style="text-align: right;">Right-aligned text</p>
        <p style="text-align: justify;">Justified text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed auctor, magna a bibendum bibendum, augue magna tincidunt enim, eget ultricies magna augue eget est.</p>
    </div>

    <div class="section">
        <h2>11. Clip Hiding</h2>
        <p style="clip: rect(0 0 0 0); position: absolute;">This paragraph is clipped with clip: rect(0 0 0 0)</p>
        <p style="clip: rect(1px, 1px, 1px, 1px); position: absolute;">This paragraph is clipped with clip: rect(1px, 1px, 1px, 1px)</p>
        <p style="clip: rect(0, 0, 0, 0); position: absolute;">This paragraph is clipped with clip: rect(0, 0, 0, 0)</p>
        <div style="clip-path: inset(50%);">
            <p>This paragraph is inside a clipped div with clip-path: inset(50%)</p>
        </div>
        <p style="clip-path: inset(100%);">This paragraph is clipped with clip-path: inset(100%)</p>
        <p style="clip-path: circle(0);">This paragraph is clipped with clip-path: circle(0)</p>
    </div>

    <div class="section">
        <h2>12. Overlapping Elements Test</h2>

        <!-- First subsection with 7 overlapping elements -->
        <div style="position: relative; width: 300px; height: 300px; border: 1px solid #000; margin-bottom: 200px;">
            <p style="position: absolute; top: 50px; left: 20px; background: rgba(255, 0, 0, 0.5); z-index: 1;">
                Element 1 (red, z-index: 1)
            </p>
            <p style="position: absolute; top: 50px; left: 20px; background: rgba(0, 255, 0, 0.5); z-index: 2;">
                Element 2 (green, z-index: 2)
            </p>
            <p style="position: absolute; top: 50px; left: 20px; background: rgba(0, 0, 255, 0.5); z-index: 3;">
                Element 3 (blue, z-index: 3)
            </p>
            <p style="position: absolute; top: 50px; left: 20px; background: rgba(255, 255, 0, 0.5); z-index: 4;">
                Element 4 (yellow, z-index: 4)
            </p>
            <p style="position: absolute; top: 50px; left: 20px; background: rgba(255, 0, 255, 0.5); z-index: 5;">
                Element 5 (magenta, z-index: 5)
            </p>
            <p style="position: absolute; top: 50px; left: 20px; background: rgba(0, 255, 255, 0.5); z-index: 6;">
                Element 6 (cyan, z-index: 6)
            </p>
            <p style="position: absolute; top: 50px; left: 20px; background: rgba(128, 0, 128, 0.5); z-index: 7;">
                Element 7 (purple, z-index: 7)
            </p>
        </div>

        <!-- Second subsection with 3 overlapping elements with different text -->
        <div style="position: relative; width: 300px; height: 200px; border: 1px solid #000;">
            <p style="position: absolute; top: 20px; left: 20px; background: rgba(255, 100, 0, 0.5); z-index: 1;">
                Element A (orange, z-index: 1)
            </p>
            <p style="position: absolute; top: 20px; left: 20px; background: rgba(100, 255, 0, 0.5); z-index: 2;">
                Element B (light green, z-index: 2)
            </p>
            <p style="position: absolute; top: 20px; left: 20px; background: rgba(0, 100, 255, 0.5); z-index: 3;">
                Element C (light blue, z-index: 3)
            </p>
        </div>
    </div>

    <div class="section" style="height: 1000px;">
    </div>
</body>
</html>
    """

    text_boxes = ""
    for _ in range(70):  # rows
        text_boxes += "<tr>"
        for _ in range(30):  # columns
            text_boxes += f"<td>{generate_random_text(14)}</td>"
        text_boxes += "</tr>"

    return html.format(text_boxes=text_boxes)


def save_html(html_content, filename="test_page.html"):
    with open(filename, "w", encoding="utf-8") as f:
        f.write(html_content)


if __name__ == "__main__":
    html_content = generate_html()
    save_html(html_content)
    print(f"Test page has been generated and saved as 'test_page.html'")
